// Entwurf Inselsterne (Nutzer 26.10.2026: „es sollte mehr Erfolge geben, und Erfolge sollen einen Sinn haben und prominent für
// Besucher sichtbar sein, ab 10 Erfolgen eine 1-Sterne-Insel …“ → Vorschlag: 1–5 Inselsterne, „los“). Nur Ansicht, speichert nichts.
// Im Spiel laden, dann IS_ON(3) (Leiste, Ziel-Fenster, Schild am Rathaus), IS_VISIT(4) (Besuchsband), IS_FRIENDS(), IS_THEIRS(),
// IS_UP(3) (Aufstieg); IS_OFF() nimmt alles zurück.
(() => {
  const TH = [10, 25, 45, 70, 100];                                         // Erfolgs-Sterne je Inselstern
  const starUrl = (fill, edge, hi) => {
    const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d');
    const pts = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return [cx + Math.cos(a) * q, cy + Math.sin(a) * q]; });
    const poly = (p, col) => { x.fillStyle = col; x.beginPath(); p.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); };
    x.lineJoin = 'round';
    poly(pts(24, 27, 21, 9.6), edge); poly(pts(24, 25, 21, 9.6), fill); if (hi) poly(pts(22.5, 22.5, 8.5, 3.9), hi);
    return c.toDataURL();
  };
  const ON = () => starUrl('#f2bd3a', '#c98f1e', '#f8d978');
  const OFF = () => document.body.classList.contains('look-wolke') ? starUrl('#e3e9f3', '#c3cee0') : starUrl('#e9dcbc', '#c9b48a');
  const row = (n, size = 15) => Array.from({ length: 5 }, (_, i) => `<i style="width:${size}px;height:${size}px;background:url(${i < n ? ON() : OFF()}) center/contain no-repeat;display:inline-block"></i>`).join('');
  // Runde 2 (Nutzer: „sieht lame aus … man sollte nicht 3/5 sehen, sondern nur die, die man schon hat – ein 3-Sterne-Restaurant hat
  // auch nicht 3/5 Sterne an der Tür“): nur verdiente Sterne, in einer Fassung. Varianten: plakette, rosette, bogen
  let VAR = 'plakette';
  const S = 3;
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; const x = c.getContext('2d'); x.scale(S, S); f(x); return c.toDataURL(); };
  const star = (x, cx, cy, R, fill = '#f2bd3a', edge = '#b07a12', hi = '#fbe39a') => {
    const p = (r0, k) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r0 * 0.46 : r0; x.lineTo(cx + Math.cos(a) * q, cy + k + Math.sin(a) * q); } x.closePath(); };
    x.fillStyle = edge; p(R, R * 0.12); x.fill(); x.fillStyle = fill; p(R, 0); x.fill();
    x.fillStyle = hi; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * 0.19 : R * 0.42; x.lineTo(cx - R * 0.1 + Math.cos(a) * q, cy - R * 0.1 + Math.sin(a) * q); } x.closePath(); x.fill();
  };
  const rr = (x, X, Y, W, H, R) => { x.beginPath(); x.roundRect(X, Y, W, H, R); };
  const BADGE = {
    plakette(n) {                                         // Emaille-Plakette mit Goldrand
      const s = 15, gap = 3, pad = 8, w = pad * 2 + n * s + (n - 1) * gap, h = 28;
      return [w, h, cv(w, h, x => {
        rr(x, 0, 1.5, w, h - 1.5, 7); x.fillStyle = '#9a6a12'; x.fill();
        rr(x, 0, 0, w, h - 2, 7); const gg = x.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, '#f6d27a'); gg.addColorStop(1, '#c9932a'); x.fillStyle = gg; x.fill();
        rr(x, 2.5, 2.5, w - 5, h - 7, 5); const en = x.createLinearGradient(0, 0, 0, h); en.addColorStop(0, '#41549c'); en.addColorStop(1, '#232d5c'); x.fillStyle = en; x.fill();
        x.strokeStyle = 'rgba(246,210,122,.7)'; x.lineWidth = 0.8; rr(x, 4.2, 4.2, w - 8.4, h - 10.4, 3.5); x.stroke();
        for (let i = 0; i < n; i++) star(x, pad + s / 2 + i * (s + gap), h / 2 - 1.5, s / 2);
        x.fillStyle = 'rgba(255,255,255,.13)'; rr(x, 3, 3, w - 6, (h - 7) / 2, 4); x.fill();
      })];
    },
    rosette(n) {                                          // Ordensrosette: Bänder, blaue Blütenblätter, Goldscheibe, Sterne darin
      const w = 46, h = 58, cx = 23, cy = 22;
      return [w, h, cv(w, h, x => {
        x.fillStyle = '#2f4a9e'; x.beginPath(); x.moveTo(cx - 3, cy + 10); x.lineTo(cx - 13, h - 2); x.lineTo(cx - 8, h - 6); x.lineTo(cx - 4, h - 1); x.lineTo(cx + 2, cy + 12); x.fill();
        x.fillStyle = '#4867c2'; x.beginPath(); x.moveTo(cx + 3, cy + 10); x.lineTo(cx + 13, h - 2); x.lineTo(cx + 8, h - 6); x.lineTo(cx + 4, h - 1); x.lineTo(cx - 2, cy + 12); x.fill();
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; x.fillStyle = i % 2 ? '#5b7bd6' : '#8aa6ea'; x.beginPath(); x.arc(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17, 5.4, 0, Math.PI * 2); x.fill(); }
        x.fillStyle = '#9a6a12'; x.beginPath(); x.arc(cx, cy + 1, 15, 0, Math.PI * 2); x.fill();
        const gg = x.createLinearGradient(0, cy - 15, 0, cy + 15); gg.addColorStop(0, '#f6d27a'); gg.addColorStop(1, '#c9932a'); x.fillStyle = gg; x.beginPath(); x.arc(cx, cy, 15, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#2b3770'; x.beginPath(); x.arc(cx, cy, 12, 0, Math.PI * 2); x.fill();
        const pos = { 1: [[0, 0, 8]], 2: [[-5, 0, 5.2], [5, 0, 5.2]], 3: [[0, -4.5, 4.6], [-5, 3.6, 4.6], [5, 3.6, 4.6]], 4: [[-4.5, -4.5, 4], [4.5, -4.5, 4], [-4.5, 4.5, 4], [4.5, 4.5, 4]],
          5: [[0, -6, 3.6], [-6, -1.5, 3.6], [6, -1.5, 3.6], [-3.6, 5.5, 3.6], [3.6, 5.5, 3.6]] }[n];
        for (const [dx, dy, r] of pos) star(x, cx + dx, cy + dy, r);
        x.fillStyle = 'rgba(255,255,255,.2)'; x.beginPath(); x.ellipse(cx - 4, cy - 6, 6, 3, -0.5, 0, Math.PI * 2); x.fill();
      })];
    },
    bogen(n) {                                            // leuchtende Sterne im Bogen, die mittleren größer
      const s = 16, w = n * (s + 2) + 12, h = 30;
      return [w, h, cv(w, h, x => {
        for (let i = 0; i < n; i++) {
          const t = n === 1 ? 0.5 : i / (n - 1), cx = 6 + s / 2 + 1 + i * (s + 2), cy = 19 - Math.sin(t * Math.PI) * 6, R = s / 2 * (0.85 + Math.sin(t * Math.PI) * 0.25);
          const gl = x.createRadialGradient(cx, cy, 0, cx, cy, R * 1.9); gl.addColorStop(0, 'rgba(255,226,130,.75)'); gl.addColorStop(1, 'rgba(255,226,130,0)');
          x.fillStyle = gl; x.beginPath(); x.arc(cx, cy, R * 1.9, 0, Math.PI * 2); x.fill();
          star(x, cx, cy, R);
        }
      })];
    },
  };
  const badge = (n, h) => { const [w0, h0, url] = BADGE[VAR](n); return `<img src="${url}" alt="${n} Inselsterne" style="height:${h}px;width:${Math.round(w0 / h0 * h)}px;vertical-align:middle">`; };
  window.IS_VAR = v => { VAR = v; return v; };
  const css = `
    .is-stars { display: inline-flex; gap: 1px; margin: 0 2px 0 8px; vertical-align: middle; }
    .is-goal { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 7px; margin: 2px 0 7px; font-size: 12px; font-weight: 700; color: #5a3d24; }
    body.look-wolke .is-goal { color: #3b4763; }
    .is-goal .is-bar { flex: 1 0 100%; height: 7px; border-radius: 4px; background: rgba(90,61,36,.15); overflow: hidden; }
    .is-goal .is-bar b { display: block; height: 100%; background: #f2bd3a; border-radius: 4px; }
    .is-sign { position: fixed; z-index: 4; transform: translate(-50%, -100%); pointer-events: none; display: flex; flex-direction: column; align-items: center; }
    .is-sign .pl { display: flex; gap: 2px; padding: 5px 8px 4px; border-radius: 7px; background: var(--grain, none), #ecd4a3; border: 1.5px solid #8a5a34; box-shadow: 0 2px 0 #8a5a34; }
    body.look-wolke .is-sign .pl { background: #fff; border: 2px solid #a9bde0; box-shadow: 0 2px 0 #c7d4e8; }
    .is-sign .st { width: 3px; height: 16px; background: #7a5232; }
    .is-vb { position: fixed; left: 50%; top: 12px; transform: translateX(-50%); z-index: 30; display: flex; align-items: center; gap: 10px; padding: 8px 10px 8px 16px;
      border-radius: 8px; background: #ecd4a3; border: 1.5px solid #8a5a34; font: 700 15px/1.2 var(--font); color: #5a3d24; white-space: nowrap; }
    body.look-wolke .is-vb { background: #fff; border: 2px solid #a9bde0; color: #3b4763; }
    .achv-row.hidden-q .ai { filter: grayscale(1) opacity(.5); }
    .achv-row.found { box-shadow: inset 0 0 0 2px #e0b23a; border-radius: 10px; }
    .is-tag { font-size: 10px; font-weight: 800; color: #b07a12; background: #fff1c4; border-radius: 5px; padding: 1px 5px; margin-left: 4px; }`;
  let timer = null, n0 = 3;
  const place = () => {
    const tb = document.getElementById('town-btn'), flag = document.getElementById('hud-flag');
    if (tb && !tb.querySelector('.is-stars')) { const s = document.createElement('span'); s.className = 'is-stars'; s.innerHTML = badge(n0, VAR === 'rosette' ? 34 : 22); flag.after(s); }
    const hall = typeof townHallAt === 'function' && townHallAt();
    let sign = document.getElementById('is-sign');
    if (hall) {
      if (!sign) { sign = document.createElement('div'); sign.id = 'is-sign'; sign.className = 'is-sign'; document.body.append(sign); }
      sign.innerHTML = VAR === 'plakette' ? `${badge(n0, 34)}<div class="st"></div>` : badge(n0, VAR === 'rosette' ? 62 : 34);
      const sz = ((ITEMS[(state.tiles.get(hall[0] + ',' + hall[1]) || {}).b] || {}).size || [2, 2]), p = toScreen(hall[0] + sz[0] / 2, hall[1] + sz[1] / 2), r = document.getElementById('world').getBoundingClientRect();
      sign.style.left = (r.left + p.x) + 'px'; sign.style.top = (r.top + p.y - 92 * cam.z) + 'px';
    }
  };
  let goalOrig = null;
  const goalLine = () => { const have = starCount(), need = TH[n0] || TH[4], left = Math.max(0, need - have), from = TH[n0 - 1] || 0;
    return `<div class="is-goal"><span>Noch ${left} Erfolge bis zum ${n0 + 1}. Inselstern</span><span class="is-bar"><b style="width:${Math.max(0, Math.min(100, Math.round((have - from) / (need - from) * 100)))}%"></b></span></div>`; };
  window.IS_ON = (n = 3) => {
    n0 = n; IS_OFF(true);
    goalOrig = goalHtml; goalHtml = () => goalOrig().replace('</h4>', '</h4>' + goalLine()); updateHud();
    let st = document.getElementById('is-style'); if (!st) { st = document.createElement('style'); st.id = 'is-style'; document.head.append(st); } st.textContent = css;
    place(); timer = setInterval(place, 150);
    return `${n} Inselsterne`;
  };
  window.IS_OFF = keepStyle => {
    clearInterval(timer); timer = null;
    if (goalOrig) { goalHtml = goalOrig; goalOrig = null; }
    for (const el of document.querySelectorAll('.is-stars, .is-goal, #is-sign, .is-vb')) el.remove();
    if (!keepStyle) { const st = document.getElementById('is-style'); if (st) st.remove(); }
    return 'aus';
  };
  window.IS_VISIT = (n = 4, name = 'Sonnenhafen', who = 'Mira') => {
    let el = document.querySelector('.is-vb'); if (el) el.remove();
    el = document.createElement('div'); el.className = 'is-vb';
    el.innerHTML = `<span>Zu Besuch bei ${who}: ${name}</span><span class="is-stars" style="margin:0">${badge(n, VAR === 'rosette' ? 36 : 24)}</span><button class="btn small">Erfolge ansehen</button><button class="btn small ghost">Nach Hause</button>`;
    document.body.append(el); return 'Besuchsband';
  };
  window.IS_FRIENDS = () => {
    const fr = [['Mira', 'Sonnenhafen', 4, '♥♥♥♡'], ['Paul', 'Kleeblattbucht', 2, '♥♥♡♡'], ['Lotte', 'Nebelsee', 5, '♥♥♥♥'], ['Ben', 'Hühnerhügel', 0, '♥♡♡♡']];
    openModal(`<h2>Freunde</h2><div class="label">Freunde</div>
      ${fr.map(([n, i, s, h]) => `<div class="fr-friend"><div class="fr-row"><span>${n} <small class="bond">${h}</small><br><small class="muted">${i}</small> ${s ? `<span class="is-stars" style="margin:0 0 0 4px">${badge(s, VAR === 'rosette' ? 30 : 18)}</span>` : ''}</span>
        <span class="fr-btns"><button class="btn small">Besuchen</button><button class="btn small ghost">Erfolge</button></span></div></div>`).join('')}
      <div class="row"><button class="btn" onclick="closeModal()">Schließen</button></div>`);
    return 'Freunde';
  };
  window.IS_THEIRS = () => {
    const A = [['🪙', 'Taler verdient', 5, 5], ['👥', 'Einwohner', 4, 5], ['🏠', 'Wohnhäuser', 3, 3], ['🎡', 'Freizeitpark', 2, 4], ['🐾', 'Tiere entdeckt', 1, 3]];
    const H = [['🌠', 'Sternenfänger', true, 'Nachts lohnt sich ein Blick nach oben …'], ['?', '???', false, 'Eine bunte Nachbarschaft …'], ['?', '???', false, 'Immer im Kreis …']];
    const stars = (n, of) => `${'⭐'.repeat(n)}${'<span class="off">⭐</span>'.repeat(of - n)}`;
    openModal(`<h2>Erfolge von Sonnenhafen</h2>
      <p class="big" style="font-size:18px;display:flex;align-items:center;gap:8px"><span class="is-stars" style="margin:0">${badge(4, VAR === 'rosette' ? 44 : 26)}</span> 4 Inselsterne · ⭐ 78</p>
      <p class="muted">Mira braucht noch 22 Erfolge für den 5. Inselstern.</p>
      ${A.map(([i, n, h, of]) => `<div class="achv-row${h === of ? ' done' : ''}"><span class="ai">${i}</span><div class="at"><div><b>${n}</b> <span class="stars">${stars(h, of)}</span></div></div></div>`).join('')}
      <div class="label">Versteckte Erfolge · 1 von 12 gefunden</div>
      ${H.map(([i, n, f, hint]) => `<div class="achv-row ${f ? 'found done' : 'hidden-q'}"><span class="ai">${f ? i : '❔'}</span><div class="at"><div><b>${n}</b>${f ? '<span class="is-tag">versteckt</span>' : ''} <span class="stars">${f ? '⭐' : '<span class="off">⭐</span>'}</span></div><small>${f ? '10 Sternschnuppen angetippt' : hint}</small></div></div>`).join('')}
      <div class="row"><button class="btn" onclick="closeModal()">Zurück zu Sonnenhafen</button></div>`);
    return 'Erfolge eines Freundes';
  };
  window.IS_UP = (n = 3) => {
    openModal(`<h2>Dein ${n}. Inselstern!</h2>
      <p style="display:flex;justify-content:center"><span class="is-stars" style="margin:0">${badge(n, VAR === 'rosette' ? 90 : 46)}</span></p>
      <p>${typeof state === 'object' && state.town ? state.town.name : 'Deine Insel'} hat jetzt ${n} Inselsterne. Besucher sehen sie am Rathaus, oben bei deinem Namen und in ihrer Freundesliste.</p>
      <div class="hall-row"><span>🪙 Taler</span><b>+${n * 5} % (vorher +${(n - 1) * 5} %)</b></div>
      <div class="hall-row"><span>🏛️ Am Rathaus</span><b>Sternenfahne weht jetzt</b></div>
      <p class="muted">Nächster Inselstern ab ⭐ ${TH[n] || '–'} Erfolgs-Sternen.</p>
      <div class="row"><button class="btn" onclick="closeModal()">Schön!</button></div>`);
    return 'Aufstieg';
  };
})();
