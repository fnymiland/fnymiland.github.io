// Entwurf Block 136 (U-Bahn): drei Tunnelportale, drei U-Bahn-Eingänge, Tunnel gestrichelt – nur zum Ansehen.
// Im Browser (?probe): fetch('tools/ubahn-entwurf.js').then(r => r.text()).then(eval). Zeichnet über das fertige Bild.
(function ubahnEntwurf() {
  for (let y = -8; y <= 20; y++) for (let x = -8; x <= 20; x++) {
    const k = x + ',' + y;
    state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k);
  }
  state.edges.clear();
  const put = (x, y, b, o = {}) => state.tiles.set(x + ',' + y, { b, lvl: 1, ...o });
  // drei Strecken nach +x, das Portal am hinteren Ende (x = 2), dahinter der Hügel über x = 0..1
  const ROWS = [0, 4, 8];
  for (const y of ROWS) for (let x = y === 8 ? 2 : 1; x <= 7; x++) put(x, y, 'schiene');
  for (let y = 7; y <= 9; y++) for (let x = -1; x <= 1; x++) put(x, y, 'weg', { style: 'platten' });   // Platz über dem Tunnel (Rampe)
  // Eingänge an einem kleinen Platz (Weg drumherum)
  const ENT = [[11, 0], [11, 4], [11, 8]];
  for (const [ex, ey] of ENT) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(ex + dx, ey + dy, 'weg', { style: 'platten' });
  // Tunnel gestrichelt: Häuserzeile, darunter der Tunnel (nur mit Werkzeug in der Hand sichtbar)
  for (let x = 2; x <= 9; x++) put(x, 13, 'haus', { rot: 0, lvl: 1 + (x % 4) });
  for (let x = 2; x <= 9; x++) put(x, 14, 'weg', { style: 'asphalt' });
  recalc();
  const c = iso(6, 6); cam.x = c.x; cam.y = c.y; cam.z = 1.5;

  const P = (x, y) => toScreen(x, y);
  // Punkt im Feld (x, y): u längs x, v längs y (−0,5…0,5), up in Bildpunkten bei z = 1
  const S = (x, y) => (u, v, up = 0) => { const p = P(x + u, y + v), z = cam.z; return [p.x, p.y - up * z]; };
  const line = (pts, col, w) => { g.strokeStyle = col; g.lineWidth = w * cam.z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); };

  // Hügel über dem Tunnel: Kuppel aus Schichten (unten breit, oben schmal), vorn an der Portalwand abgeschnitten
  function hill(s, u0, len, H, wv, col) {
    const N = 16, uc = u0 - len * 0.32, ru = len * 0.68, M = 28;
    for (let k = 0; k <= N; k++) {
      const f = k / N, sc = Math.sqrt(1 - f * f), h = H * f, pts = [];
      for (let i = 0; i < M; i++) { const t = i / M * Math.PI * 2; pts.push(s(Math.min(u0, uc + ru * sc * Math.cos(t)), wv * sc * Math.sin(t), h)); }
      poly(pts, shade(col, -0.16 + 0.22 * f));
    }
  }
  // Öffnung (Bogen) in der Wand u = u0
  function archPts(s, u0, w, spring, top, n = 12) {
    const pts = [s(u0, -w, 0)];
    pts.push(s(u0, -w, spring));
    for (let i = 0; i <= n; i++) { const a = Math.PI - i * Math.PI / n; pts.push(s(u0, Math.cos(a) * w, spring + Math.sin(a) * (top - spring))); }
    pts.push(s(u0, w, 0));
    return pts;
  }
  function mouth(s, u0, w, spring, top, rect) {
    const pts = rect ? [s(u0, -w, 0), s(u0, -w, top), s(u0, w, top), s(u0, w, 0)] : archPts(s, u0, w, spring, top);
    poly(pts, '#231d1a');
    // Schiene läuft hinein und verschwindet im Dunkel
    for (const o of [-0.09, 0.09]) line([s(u0 + 0.02, o, 0), s(u0 - 0.25, o * 0.8, 0)], 'rgba(150,150,160,0.55)', 1);
  }

  const PORTALS = [
    { name: 'A Backstein', draw(s) {
      hill(s, -0.5, 1.8, 32, 0.78, '#8fcf68');
      const W0 = 0.44;
      poly([s(-0.5, -W0, 0), s(-0.5, W0, 0), s(-0.5, W0, 26), s(-0.5, -W0, 26)], '#b9644a');            // Stirnwand
      g.save(); g.beginPath(); [s(-0.5, -W0, 0), s(-0.5, W0, 0), s(-0.5, W0, 26), s(-0.5, -W0, 26)].forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.clip();
      for (let h = 3; h < 26; h += 3) line([s(-0.5, -W0, h), s(-0.5, W0, h)], 'rgba(90,40,25,0.35)', 0.5);   // Fugen
      g.restore();
      poly(archPts(s, -0.5, 0.34, 10, 21), '#d6c3a5');                                                      // Bogensteine
      mouth(s, -0.5, 0.29, 10, 18.5);
      poly([s(-0.5, -W0 - 0.03, 26), s(-0.5, W0 + 0.03, 26), s(-0.5, W0 + 0.03, 28.5), s(-0.5, -W0 - 0.03, 28.5)], '#d9cbb5');   // Abdeckung
      for (const v of [-W0, W0 - 0.06]) poly([s(-0.5, v, 0), s(-0.5, v + 0.06, 0), s(-0.5, v + 0.06, 26), s(-0.5, v, 26)], '#a3543d');   // Pfeiler
    } },
    { name: 'B Naturstein im Hügel', draw(s) {
      hill(s, -0.45, 1.9, 36, 0.85, '#86c75f');
      const face = archPts(s, -0.48, 0.46, 9, 27);
      poly(face, '#a8a197');                                                                                    // Steinkranz
      const rnd = (i) => ((Math.sin(i * 91.7) + 1) / 2);
      for (let i = 0; i < 9; i++) { const a = Math.PI - i * Math.PI / 8, r0 = 0.39, r1 = 0.47; const p = s(-0.48, Math.cos(a) * (r0 + r1) / 2, 10 + Math.sin(a) * 16); g.fillStyle = shade('#a8a197', rnd(i) * 0.25 - 0.12); g.beginPath(); g.ellipse(p[0], p[1], 3.6 * cam.z, 2.6 * cam.z, 0, 0, 7); g.fill(); }
      mouth(s, -0.48, 0.33, 9, 21);
      for (const [v, h] of [[-0.7, 6], [0.72, 9], [0.1, 33]]) { const p = s(-0.6, v, h); g.fillStyle = '#5fa847'; g.beginPath(); g.arc(p[0], p[1], 4.5 * cam.z, 0, 7); g.fill(); g.fillStyle = '#7cc45c'; g.beginPath(); g.arc(p[0] - 1 * cam.z, p[1] - 1.5 * cam.z, 3 * cam.z, 0, 7); g.fill(); }
    } },
    { name: 'C Rampe (Innenstadt)', tiles: 2, draw(s) {
      // offene Rinne über zwei Felder: vorn (u = 1,5) ebenerdig, hinten (u = −0,5) tief; dort verschwindet sie unter dem Platz
      const w = 0.34, D = 24, u0 = -0.5, u1 = 1.5, d = u => D * Math.pow((u1 - u) / (u1 - u0), 1.25), N = 16, us = i => u1 - (u1 - u0) * i / N;
      const floor = [], wallTop = [], wallBot = [];
      for (let i = 0; i <= N; i++) { const u = us(i); floor.push([s(u, -w, -d(u)), s(u, w, -d(u))]); wallTop.push(s(u, -w, 0)); wallBot.push(s(u, -w, -d(u))); }
      g.save(); g.beginPath(); [s(u1, -w, 0), s(u0, -w, 0), s(u0, w, 0), s(u1, w, 0)].forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip();   // nur durch die Öffnung sichtbar
      poly([...floor.map(f => f[0]), ...floor.map(f => f[1]).reverse()], '#8e8a82');                         // Boden der Rinne
      poly([...wallTop, ...wallBot.slice().reverse()], '#bcb7ad');                                           // sichtbare Innenwand (links)
      for (let i = 2; i < N; i += 3) line([wallTop[i], wallBot[i]], 'rgba(90,85,78,0.25)', 0.5);            // Fugen
      poly([s(u0, -w, -D), s(u0, w, -D), s(u0, w, 0), s(u0, -w, 0)], '#a9a399');                             // Stirn unter dem Platz
      poly([s(u0, -0.27, -D), s(u0, 0.27, -D), s(u0, 0.27, -D + 17), s(u0, -0.27, -D + 17)], '#231d1a');      // Tunnelmund
      for (const o of [-0.09, 0.09]) line(Array.from({ length: N + 1 }, (_, i) => { const u = us(i); return s(u, o, -d(u)); }), '#7c838e', 1.1);   // Schienen
      g.restore();
      for (const sg of [-1, 1]) {                                                                             // Kante mit Geländer
        const v = sg * (w + 0.03);
        poly([s(u1, v - 0.03, 0), s(u0, v - 0.03, 0), s(u0, v + 0.03, 0), s(u1, v + 0.03, 0)], '#d9d5cc');
        line([s(u1, v, 6), s(u0, v, 6)], '#6a7280', 1);
        for (let u = u1; u >= u0 - 0.01; u -= 0.25) line([s(u, v, 0), s(u, v, 6)], '#6a7280', 0.8);
      }
      line([s(u0, -w - 0.03, 6), s(u0, w + 0.03, 6)], '#6a7280', 1);
    } },
  ];

  // U-Bahn-Schild: blaues Quadrat mit weißem U (Zeichen, keine Schrift)
  function uSign(p, size) {
    const z = cam.z, a = size * z;
    g.fillStyle = '#2f62b8'; g.fillRect(p[0] - a / 2, p[1] - a / 2, a, a);
    g.strokeStyle = '#ffffff'; g.lineWidth = 0.9 * z; g.strokeRect(p[0] - a / 2 + 0.8 * z, p[1] - a / 2 + 0.8 * z, a - 1.6 * z, a - 1.6 * z);
    g.fillStyle = '#ffffff'; g.font = `800 ${a * 0.72}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('U', p[0], p[1] + a * 0.04); g.textAlign = 'left';
  }
  function stairs(s, u0, u1, w, deep = 7) {
    poly([s(u0, -w, 0), s(u1, -w, 0), s(u1, w, 0), s(u0, w, 0)], '#3a332e');                                   // Loch
    for (let i = 1; i <= 6; i++) { const u = u0 + (u1 - u0) * i / 7; line([s(u, -w, -i * deep / 7), s(u, w, -i * deep / 7)], 'rgba(220,210,195,0.55)', 0.8); }
  }
  const ENTRANCES = [
    { name: 'A Treppe mit Mast', draw(s) {
      stairs(s, -0.36, 0.38, 0.24);
      pbBox(s, 1, 0, -0.44, -0.36, -0.32, 0.32, 0, 6, '#cfc6b4', '#e3dccd', cam.z, false);                       // hinten
      for (const sg of [-1, 1]) pbBox(s, 1, 0, -0.44, 0.38, sg * 0.24, sg * 0.32, 0, 6, '#cfc6b4', '#e3dccd', cam.z, false);   // Seiten
      pbBox(s, 1, 0, -0.42, -0.36, -0.44, -0.36, 0, 30, '#5b6470', '#6c7682', cam.z, false);                     // Mast
      uSign(s(-0.39, -0.4, 34), 11);
    } },
    { name: 'B Pavillon mit Glasdach', draw(s) {
      stairs(s, -0.34, 0.36, 0.22);
      const GR = '#2f7a56';
      for (const sg of [-1, 1]) pbBox(s, 1, 0, -0.4, 0.36, sg * 0.24, sg * 0.29, 0, 5, GR, '#3f9068', cam.z, false);   // Gitter (Sockel)
      pbBox(s, 1, 0, -0.4, -0.34, -0.29, 0.29, 0, 5, GR, '#3f9068', cam.z, false);
      for (const [u, v] of [[-0.38, -0.3], [-0.38, 0.3], [0.34, -0.3], [0.34, 0.3]]) pbBox(s, 1, 0, u - 0.025, u + 0.025, v - 0.025, v + 0.025, 0, 18, GR, '#3f9068', cam.z, false);   // Pfosten
      g.globalAlpha = 0.85; pbBox(s, 1, 0, -0.44, 0.42, -0.36, 0.36, 18, 19.5, '#9fd3e3', '#c8ecf5', cam.z, false); g.globalAlpha = 1;   // Glasdach
      line([s(0.42, -0.36, 19.5), s(0.42, 0.36, 19.5)], GR, 1.6); line([s(-0.44, 0.36, 19.5), s(0.42, 0.36, 19.5)], GR, 1.6);
      const arc = []; for (let i = 0; i <= 12; i++) { const a = Math.PI - i * Math.PI / 12; arc.push(s(0.36, Math.cos(a) * 0.3, 19.5 + Math.sin(a) * 5)); }
      line(arc, GR, 1.6);
      for (const v of [-0.3, 0.3]) { const p = s(0.36, v, 21); g.fillStyle = '#ffd56b'; g.beginPath(); g.arc(p[0], p[1], 2 * cam.z, 0, 7); g.fill(); }
      uSign(s(0.36, 0, 27), 9);
    } },
    { name: 'C Häuschen', draw(s) {
      pbBox(s, 1, 0, -0.36, 0.3, -0.32, 0.32, 0, 15, '#e9e1d2', '#d8cfbf', cam.z, false);
      poly([s(0.3, -0.24, 0), s(0.3, 0.24, 0), s(0.3, 0.24, 12), s(0.3, -0.24, 12)], '#9fc9dc');                  // Glas
      poly([s(0.3, -0.1, 0), s(0.3, 0.1, 0), s(0.3, 0.1, 10), s(0.3, -0.1, 10)], '#3a332e');                       // offene Tür, Treppe dahinter
      pbBox(s, 1, 0, -0.42, 0.36, -0.38, 0.38, 15, 17, '#2f62b8', '#3f74c8', cam.z, false);                       // Dachkante blau
      line([s(0.0, 0, 17), s(0.0, 0, 21)], '#5b6470', 1.4);
      uSign(s(0.0, 0.0, 26), 10);
    } },
  ];

  // Tunnel gestrichelt (Bauansicht): unter Häusern und Weg, mit Station
  function tunnelOverlay() {
    const z = cam.z;
    const pts = []; for (let x = 1; x <= 10; x++) pts.push(P(x, 13));
    g.save();
    if (window.__xray) { g.fillStyle = 'rgba(245,240,255,0.45)'; g.fillRect(0, 0, W, H); }   // Bauansicht: Welt blass, Tunnel kräftig
    g.setLineDash([6 * z, 5 * z]); g.lineCap = 'round';
    g.strokeStyle = 'rgba(60,40,110,0.25)'; g.lineWidth = 7 * z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
    g.strokeStyle = '#6a52c4'; g.lineWidth = 2.4 * z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
    g.restore();
    const st = P(6, 13); uSign([st.x, st.y - 4 * z], 9);
  }

  function label(x, y, text) {
    const p = P(x, y); g.font = `800 ${Math.max(11, 7 * cam.z)}px system-ui, sans-serif`; g.textAlign = 'center';
    const w = g.measureText(text).width + 12 * cam.z / 1.5;
    g.fillStyle = 'rgba(255,250,240,0.95)'; g.fillRect(p.x - w / 2, p.y - 9 * cam.z / 1.5 * 1.3, w, 15 * cam.z / 1.5 * 1.3);
    g.fillStyle = '#6b4f3a'; g.textBaseline = 'middle'; g.fillText(text, p.x, p.y); g.textAlign = 'left';
  }

  const orig = window.__ubOrigRender || render;
  window.__ubOrigRender = orig;
  window.render = function (now) {
    orig(now);
    g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    PORTALS.forEach((pt, i) => { pt.draw(S(2, ROWS[i])); label(4.5, ROWS[i] + 1.4, 'Portal ' + pt.name); });
    ENTRANCES.forEach((e, i) => { e.draw(S(...ENT[i])); label(ENT[i][0] + 2.2, ENT[i][1] + 1.6, 'Eingang ' + e.name); });
    tunnelOverlay(); label(6, 16, 'Tunnel mit Werkzeug in der Hand (gestrichelt)');
    g.restore();
  };
  return 'ok';
})();
