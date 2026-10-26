// Entwürfe (Nutzer 26.10.2026: „das Beet sollten wir nicht als Icon nehmen, das sieht doof aus, weil es so braun ist“ und „können wir
// ein eigenes Symbol für Sternstaub erstellen?“). Im Spiel laden, dann SE_SHEET() (große Übersicht) oder SE_TRY('gestalten', name)
// bzw. SE_TRY('sternstaub', name) (im Spiel an Ort und Stelle); SE_TRY(null) nimmt es zurück. Gezeichnet mit den Grundformen des Spiels.
(() => {
  const star5 = (cx, cy, R, r, col, sq = 0.92) => poly(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return [cx + Math.cos(a) * q, cy + Math.sin(a) * q * sq]; }), col);
  const goldStar = (cx, cy, R) => { star5(cx, cy + R * 0.14, R, R * 0.45, '#c98f1e'); star5(cx, cy, R, R * 0.45, '#f2bd3a'); star5(cx - R * 0.08, cy - R * 0.08, R * 0.42, R * 0.2, '#f8d978'); };
  const glow = (cx, cy, r, col) => { const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); };
  const DRAW = {
    sternglas() {                                          // Glas mit Nachthimmel, darin leuchtende Sterne; Korken oben
      uiShadow(32, 58, 15);
      glow(32, 42, 24, 'rgba(255,226,140,.5)');
      cyl(32, 56, 14, 6.5, 30, '#33406f');
      const gr = g.createLinearGradient(18, 0, 46, 0); gr.addColorStop(0, '#4a5c9c'); gr.addColorStop(0.5, '#33406f'); gr.addColorStop(1, '#232c52');
      g.fillStyle = gr; g.fillRect(18, 26, 28, 30); g.beginPath(); g.ellipse(32, 56, 14, 6.5, 0, 0, Math.PI); g.fill();
      for (const [x, y, r] of [[26, 46, 5.2], [38, 50, 4.4], [33, 38, 5.6], [24, 35, 3.4], [40, 37, 3], [30, 52, 3.2]]) { star5(x, y, r, r * 0.45, '#ffd34d'); star5(x - 0.4, y - 0.5, r * 0.45, r * 0.2, '#fff6d0'); }
      for (const [x, y] of [[36, 44], [22, 50], [42, 45], [28, 30]]) uiDisc(x, y, 0.9, '#fff6d0');
      g.globalAlpha = 0.28; g.fillStyle = '#ffffff'; g.fillRect(20.5, 29, 2.6, 22); g.globalAlpha = 1;      // Glanz links
      ellipse(32, 26, 14, 6.5, '#7f8fc4'); ellipse(32, 26, 11.5, 5, '#2a3560');
      cyl(32, 26, 8.5, 3.8, 7, '#c99a5e'); ellipse(32, 19, 8.5, 3.8, '#e3b77a');
      uiStar4(50, 14, 5, '#ffe48a'); uiStar4(14, 22, 3.6, '#ffe48a');
    },
    sternhaufen() {                                        // flaches Häufchen goldener Staub, ein Stern obendrauf
      uiShadow(32, 57, 23);
      g.fillStyle = '#d9a12e'; g.beginPath(); g.ellipse(32, 52, 23, 6.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f0c24a'; g.beginPath(); g.moveTo(9, 52); g.bezierCurveTo(14, 44, 24, 39, 32, 39); g.bezierCurveTo(41, 39, 50, 44, 55, 52);
      g.bezierCurveTo(46, 55, 18, 55, 9, 52); g.fill();
      g.fillStyle = '#f7d977'; g.beginPath(); g.moveTo(15, 49); g.bezierCurveTo(19, 44, 25, 41.5, 31, 41.5); g.bezierCurveTo(26, 44, 23, 47, 22, 51); g.closePath(); g.fill();
      for (const [x, y, c] of [[18, 49, '#fff6d0'], [26, 44, '#fff6d0'], [36, 46, '#c98f1e'], [45, 49, '#c98f1e'], [31, 50, '#fff6d0'], [41, 43, '#fff6d0'], [24, 51, '#c98f1e'], [50, 51, '#fff6d0']]) uiDisc(x, y, 1.3, c);
      goldStar(32, 27, 14);
      uiStar4(52, 22, 5, '#ffe48a'); uiStar4(11, 36, 4, '#ffe48a'); uiStar4(46, 36, 2.6, '#fff3c4');
    },
    sternschnuppe() {                                      // Stern mit buntem Schweif
      g.lineCap = 'round';
      for (const [col, w, off] of [['#f6b8d0', 7, 7], ['#c9b6f0', 6, 0], ['#ffe48a', 5, -7]]) {
        g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(8 + off * 0.3, 56 + off * 0.2); g.quadraticCurveTo(16 + off, 34 + off * 0.6, 34, 28); g.stroke();
      }
      goldStar(40, 24, 17);
      uiStar4(14, 14, 4, '#ffe48a'); uiStar4(56, 48, 4.5, '#ffe48a');
    },
    sternsack() {                                          // Säckchen aus Stoff, oben zugebunden mit Rüsche, Sterne schauen heraus
      uiShadow(32, 58, 17);
      const cloth = '#8f7fd6', dark = shade(cloth, -0.22), light = shade(cloth, 0.16);
      goldStar(23, 13, 7.5); goldStar(41, 12, 7); goldStar(32, 8, 8.5);
      g.fillStyle = dark; g.beginPath(); g.moveTo(26, 25); g.bezierCurveTo(18, 17, 16, 21, 17, 15); g.bezierCurveTo(24, 20, 40, 20, 47, 15); g.bezierCurveTo(48, 21, 46, 17, 38, 25); g.closePath(); g.fill();   // Rüsche hinten
      g.fillStyle = dark; g.beginPath(); g.moveTo(26, 29); g.bezierCurveTo(8, 36, 9, 57, 32, 57); g.bezierCurveTo(55, 57, 56, 36, 38, 29); g.closePath(); g.fill();
      g.fillStyle = cloth; g.beginPath(); g.moveTo(26, 29); g.bezierCurveTo(9, 36, 11, 55, 30, 55.5); g.bezierCurveTo(39, 55, 41, 40, 35, 29); g.closePath(); g.fill();
      g.fillStyle = light; g.beginPath(); g.moveTo(24, 33); g.bezierCurveTo(16, 38, 15, 46, 19, 51); g.bezierCurveTo(19, 44, 21, 38, 28, 33); g.closePath(); g.fill();
      g.fillStyle = cloth; g.beginPath(); g.moveTo(27, 27); g.bezierCurveTo(21, 23, 19, 24, 19, 20); g.bezierCurveTo(25, 23, 39, 23, 45, 20); g.bezierCurveTo(45, 24, 43, 23, 37, 27); g.closePath(); g.fill();   // Rüsche vorn
      g.fillStyle = '#e7c36a'; g.beginPath(); g.ellipse(32, 28, 7.5, 2.6, 0, 0, Math.PI * 2); g.fill();     // Band
      uiLine([[37, 28], [43, 35]], '#e7c36a', 2); uiLine([[37, 28], [40, 37]], '#e7c36a', 2);
      for (const [x, y] of [[25, 43], [35, 47], [23, 51], [40, 40]]) uiStar4(x, y, 3, '#ffe48a');
    },
    giesskanne() {                                         // Gießkanne mit Tropfen (Gestalten: Garten, Blumen, Deko)
      uiShadow(30, 57, 19);
      uiLine([[40, 44], [55, 24]], '#3f7fb6', 5); uiLine([[40, 43], [54, 24]], '#6aa7da', 2.2);
      ellipse(56, 22, 4.2, 3, '#3f7fb6'); ellipse(56, 21.5, 3, 2, '#9cc9ec');
      cyl(28, 55, 15, 7, 22, '#5d98cf'); ellipse(28, 33, 15, 7, '#7fb4e2'); ellipse(28, 33, 11, 5, '#3f7fb6');
      g.strokeStyle = '#3f7fb6'; g.lineWidth = 4.5; g.lineCap = 'round'; g.beginPath(); g.arc(28, 33, 13, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
      g.strokeStyle = '#7fb4e2'; g.lineWidth = 1.6; g.beginPath(); g.arc(28, 32, 13, Math.PI * 1.15, Math.PI * 1.5); g.stroke();
      g.globalAlpha = 0.3; g.fillStyle = '#ffffff'; g.fillRect(16, 37, 3, 14); g.globalAlpha = 1;
      for (const [x, y] of [[59, 30], [61, 37], [57, 41]]) { ellipse(x, y, 1.7, 2.4, '#7fc2ef'); }
      for (const [x, y, c] of [[22, 47, '#f2a0c8'], [30, 49, '#f6d35a'], [36, 46, '#f2a0c8']]) { uiDisc(x, y, 2.6, c); uiDisc(x, y, 1, '#fff6d0'); }
    },
  };
  const S = 3, url = {};
  const paint = name => {
    if (url[name]) return url[name];
    const c = document.createElement('canvas'); c.width = c.height = 64 * S; const x = c.getContext('2d'); x.scale(S, S);
    const prev = g; g = x; try { DRAW[name](); } finally { g = prev; }
    return (url[name] = uiTrim(c).toDataURL());
  };
  const pic = name => DRAW[name] ? paint(name) : uiIcon(name);
  window.SE_DRAW = DRAW;
  window.SE_SETS = {
    gestalten: ['blumen', 'giesskanne', 'blumentopf', 'busch', 'brunnen', 'laterne'],
    sternstaub: ['kristall', 'funkel', 'sternglas', 'sternhaufen', 'sternschnuppe', 'sternsack'],
  };
  window.SE_NAMES = { blumen: 'heute: Beet', giesskanne: 'Gießkanne (neu)', blumentopf: 'Blumentopf', busch: 'Busch', brunnen: 'Brunnen', laterne: 'Laterne',
    kristall: 'heute oben: Kristall', funkel: 'heute im Text: Funkeln', sternglas: 'Sternenglas', sternhaufen: 'Sternstaub-Häufchen', sternschnuppe: 'Sternschnuppe', sternsack: 'Sternsäckchen' };
  // große Übersicht über dem Spiel: je Satz eine Reihe, Bild groß und klein, auf Papier und auf der Leiste
  window.SE_SHEET = set => {
    let el = document.getElementById('se-sheet'); if (el) el.remove();
    if (!set) return 'aus';
    el = document.createElement('div'); el.id = 'se-sheet';
    el.style.cssText = 'position:fixed;inset:0;z-index:999;background:#f3efe6;display:flex;flex-wrap:wrap;align-content:flex-start;gap:14px;padding:14px;font:700 13px/1.2 var(--font);color:#5a3d24;overflow:auto';
    for (const n of SE_SETS[set]) {
      const u = pic(n);
      const card = document.createElement('div');
      card.style.cssText = 'width:170px;display:flex;flex-direction:column;align-items:center;gap:8px;background:#fffaf0;border-radius:12px;padding:10px';
      card.innerHTML = `<div style="width:120px;height:110px;background:url(${u}) center/contain no-repeat"></div>
        <div style="display:flex;gap:10px;align-items:center"><span style="width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#f3dcae,#d7a868 72%);border:2px solid #8a5a34;display:grid;place-items:center"><i style="width:30px;height:28px;background:url(${u}) center/contain no-repeat"></i></span>
        <span style="background:#ecd4a3;border:1.5px solid #8a5a34;border-radius:6px;padding:4px 8px;display:flex;gap:4px;align-items:center"><i style="width:22px;height:20px;background:url(${u}) center/contain no-repeat"></i>300</span></div>
        <div style="text-align:center">${SE_NAMES[n]}</div>`;
      el.append(card);
    }
    document.body.append(el);
    return SE_SETS[set].length;
  };
  // im Spiel ausprobieren: Gestalten in der Bauleiste bzw. Sternstaub oben und ✨ in Texten
  let keep = null;
  window.SE_TRY = (what, name) => {
    if (!keep) keep = { gest: null, sd: document.querySelector('#sd-btn i.wi')?.style.backgroundImage, wt: getComputedStyle(document.documentElement).getPropertyValue('--wt-funkel') };
    const gest = document.querySelector('#cats [data-menu="gestalten"] i.wi');
    if (gest && keep.gest === null) keep.gest = gest.style.backgroundImage;
    if (what === 'gestalten' && gest) gest.style.backgroundImage = name ? `url(${pic(name)})` : keep.gest;
    if (what === 'sternstaub') {
      const i = document.querySelector('#sd-btn i.wi');
      if (i) i.style.backgroundImage = name ? `url(${pic(name)})` : keep.sd;
      document.documentElement.style.setProperty('--wt-funkel', name ? `url(${pic(name)})` : keep.wt);
    }
    return `${what}: ${name || 'zurück'}`;
  };
})();
