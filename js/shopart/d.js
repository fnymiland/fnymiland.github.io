'use strict';
// Ladenbilder, Gruppe d (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, kText, faceAt)
// Nudelbar (Lack-Rot, Pagodendach, Nudelschale), Konditorei (Rosa, Zuckerguss, Torte), Chocolaterie (Zartbitter/Rosé/Gold,
// Schokoladentafel), Spielzeugladen (Sonnengelb/Blau, Regenbogen-Markise, Teddy mit Windrad).
// Alles in einer Klammer: die Hilfsfunktionen sollen nicht mit denen der anderen Gruppen zusammenstoßen.
(() => {
  const TAU = Math.PI * 2;
  const lit = () => night > 0.15 && isLive();
  function oval(x, y, rx, ry, rot, col) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = col; g.fill(); }
  // Traufecken eines Blocks (Überstand wie in K.block), im Kreis: vorn-links, vorn-rechts, hinten-rechts, hinten-links.
  // Kante i läuft von Ecke i zu Ecke i+1, ihre Außenseite zeigt nach EDGE_N[i].
  const EDGE_N = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function eaveCorners(K, B, over = 1.12, up = 0) {
    return [[1, -1], [1, 1], [-1, 1], [-1, -1]].map(([sa, sb]) => ({
      sa, sb, p: K.P(B.a + sa * B.ha * over, B.b + sb * B.hb * over, B.lift + B.h + up), d: K.depth(B.a + sa * B.ha, B.b + sb * B.hb),
    }));
  }
  // Markise in festen Farben (Streifen der Reihe nach) mit Zacken-Saum
  function stripedAwning(K, B, cols, n = cols.length, h0 = 0.44, h1 = 0.56) {
    const F = B.faces.front;
    if (!F) return;
    const z = K.z, w = 0.88 / n;
    for (let i = 0; i < n; i++) {
      const t0 = 0.06 + i * w, t1 = t0 + w, col = cols[i % cols.length];
      faceQuad(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, C(col));
      poly([faceAt(F, t0, F.H * h0), faceAt(F, t1, F.H * h0), faceAt(F, (t0 + t1) / 2, F.H * h0 - 1.8 * z)], C(shade(col, -0.1)));
    }
    faceQuad(F.P, F.Q, 0.06, 0.94, F.H * h1 - 0.8 * z, F.H * h1, C(shade(cols[0], 0.25)));
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Nudelbar: lackrotes Haus, dunkles Dach mit hochgeschwungenen Ecken, Nudelschale mit Stäbchen auf dem Dach,
  // rote Papierlaternen an den Traufecken, Noren-Vorhang an der Tür, Nobori-Fahne davor.
  // ---------------------------------------------------------------------------------------------------------------
  function pagodaEaves(K, B) {
    const z = K.z, E = eaveCorners(K, B);
    const tip = c => K.P(B.a + c.sa * B.ha * 1.42, B.b + c.sb * B.hb * 1.42, B.lift + B.h + 6);
    // Schwung-Keile an den Ecken, dann die dunkle Traufkante mit hochgebogenen Enden
    for (let i = 0; i < 4; i++) {
      const c = E[i], prev = E[(i + 3) % 4].p, next = E[(i + 1) % 4].p, T = tip(c);
      const l1 = lerp(c.p, prev, 0.3), l2 = lerp(c.p, next, 0.3);
      g.beginPath(); g.moveTo(...l1); g.quadraticCurveTo(c.p[0], c.p[1], T[0], T[1]); g.quadraticCurveTo(c.p[0], c.p[1], l2[0], l2[1]);
      g.lineTo(c.p[0], c.p[1] - 1.5 * z); g.closePath(); g.fillStyle = C('#2d2d38'); g.fill();
    }
    g.strokeStyle = C('#191921'); g.lineWidth = 1.8 * z; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {
      const A = E[i], Bc = E[(i + 1) % 4], TA = tip(A), TB = tip(Bc);
      const m1 = lerp(A.p, Bc.p, 0.3), m2 = lerp(A.p, Bc.p, 0.7);
      g.beginPath(); g.moveTo(...TA); g.quadraticCurveTo(A.p[0], A.p[1], m1[0], m1[1]); g.lineTo(...m2); g.quadraticCurveTo(Bc.p[0], Bc.p[1], TB[0], TB[1]); g.stroke();
    }
    for (const c of E) { const T = tip(c); circle(T[0], T[1], 1.1 * z, C('#e0b44a')); }
    return E;
  }
  function paperLantern(x, y, z, L) {
    kLine({ z }, [x, y - 3.5 * z], [x, y - 1.5 * z], '#2d2d38', 0.5);
    oval(x, y + 2.2 * z, 2.5 * z, 3 * z, 0, L ? '#ffb56b' : C('#e8412e'));
    oval(x - 0.8 * z, y + 1.6 * z, 0.8 * z, 1.9 * z, 0, L ? '#fff1b8' : C('#ff8a70'));   // Glanz
    g.fillStyle = C('#1f1f28');
    g.fillRect(x - 1.5 * z, y - 1.3 * z, 3 * z, 1 * z); g.fillRect(x - 1.5 * z, y + 4.9 * z, 3 * z, 1 * z);   // Deckel oben/unten
    kLine({ z }, [x, y + 5.9 * z], [x, y + 7.6 * z], '#e0b44a', 0.6);                  // Quaste
    if (L) kGlow(x, y + 2.2 * z, z, 16);
  }
  function noodleBowl(x, y, z, now) {                                     // (x, y): Mitte des Randes
    const W = 10 * z, D = 8 * z, R = 3.3 * z;
    ellipse(x, y + D + 0.2 * z, 4.2 * z, 1.5 * z, C('#d9cfc0'));          // Fuß
    g.beginPath(); g.ellipse(x, y, W, D, 0, 0, Math.PI); g.fillStyle = C('#fbf7f0'); g.fill();
    g.beginPath(); g.ellipse(x + 3 * z, y, W - 3 * z, D - 0.6 * z, 0, 0, Math.PI / 2); g.lineTo(x + 3 * z, y); g.fillStyle = C('#e6dfd3'); g.fill();   // Schatten rechts
    g.strokeStyle = C('#c0392b'); g.lineWidth = 1.3 * z;                   // rotes Band mit Wellen
    g.beginPath(); g.ellipse(x, y + 1.2 * z, W - 0.4 * z, D - 3.2 * z, 0, 0.12, Math.PI - 0.12); g.stroke();
    for (let i = 0; i < 4; i++) circle(x + (i - 1.5) * 4 * z, y + 4.6 * z - Math.abs(i - 1.5) * 0.6 * z, 0.8 * z, C('#c0392b'));
    ellipse(x, y, W, R, C('#efe6d8'));                                    // Innenwand
    poly([[x + 2.5 * z, y - 0.5 * z], [x + 6.5 * z, y - 1.5 * z], [x + 6.8 * z, y - 7.5 * z], [x + 2.8 * z, y - 6.5 * z]], C('#27432e'));   // Nori
    ellipse(x, y + 0.5 * z, W - 1.3 * z, R - 0.8 * z, C('#e9b949'));    // Brühe mit Nudeln
    g.strokeStyle = C('#fbe09a'); g.lineWidth = 0.7 * z;
    for (let r = 0; r < 3; r++) {
      g.beginPath();
      for (let i = 0; i <= 8; i++) { const px = x - 6.5 * z + i * 1.6 * z, py = y - 0.4 * z + r * 1 * z + (i & 1 ? -0.5 : 0.5) * z; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
    }
    oval(x - 4 * z, y + 0.1 * z, 2.1 * z, 1.3 * z, -0.2, C('#fffaf0'));   // Ei
    circle(x - 3.7 * z, y + 0.1 * z, 0.9 * z, C('#f2a33a'));
    circle(x + 2.8 * z, y + 0.4 * z, 1.7 * z, C('#fffaf0'));             // Narutomaki
    circle(x + 2.8 * z, y + 0.4 * z, 0.8 * z, C('#f07aa0'));
    for (const [dx, dy] of [[-1, -0.6], [0.4, 1], [-1.8, 1.2], [5.5, 0.8]]) circle(x + dx * z, y + dy * z, 0.55 * z, C('#6cbf4f'));   // Lauch
    g.strokeStyle = C('#c0392b'); g.lineWidth = 1.3 * z;                   // roter Rand
    g.beginPath(); g.ellipse(x, y, W, R, 0, 0, TAU); g.stroke();
    // Stäbchen schräg in der Schale
    kLine({ z }, [x + 0.5 * z, y + 0.3 * z], [x + 8.5 * z, y - 16 * z], '#d9a066', 1.3);
    kLine({ z }, [x + 2.5 * z, y + 0.6 * z], [x + 11.5 * z, y - 14 * z], '#c98d5c', 1.3);
    kLine({ z }, [x + 7.8 * z, y - 14.6 * z], [x + 8.5 * z, y - 16 * z], '#c0392b', 1.4);
    kLine({ z }, [x + 10.7 * z, y - 12.6 * z], [x + 11.5 * z, y - 14 * z], '#c0392b', 1.4);
    // Dampf
    g.save(); g.globalAlpha *= 0.75; g.strokeStyle = C('#ffffff'); g.lineWidth = 1 * z;
    for (let i = 0; i < 3; i++) {
      const ph = (now / 1600 + i / 3) % 1, sx = x + (i - 1.3) * 3 * z, sy = y - 2 * z - ph * 9 * z;
      g.globalAlpha = 0.75 * (1 - ph);
      g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 1.6 * z, sy - 1.8 * z, sx, sy - 3.6 * z); g.quadraticCurveTo(sx - 1.6 * z, sy - 5.4 * z, sx, sy - 7 * z); g.stroke();
    }
    g.restore();
  }
  SHOP_ART.nudelbar = function (K, s, now, x, y, t) {
    const z = K.z, L = lit(), H0 = 20, RH = 10;
    K.scene([[-0.08, 0, () => {
      const B = shopHouse(K, { wall: '#c0392b', roof: '#2d2d38', awning: null, roofType: 'hip', h: H0, roofH: RH, trim: '#2d2d38' });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.02, 0.98, F.H * 0.45, F.H * 0.53, C('#2d2d38'));            // Vordach über dem Laden
        faceQuad(F.P, F.Q, 0.02, 0.98, F.H * 0.53, F.H * 0.55, C('#e0b44a'));
        for (const tt of [0.25, 0.41]) faceQuad(F.P, F.Q, tt - 0.008, tt + 0.008, F.H * 0.08, F.H * 0.42, C('#2d2d38'));   // Sprossen
        // Noren: drei helle Stoffbahnen mit Schalen-Zeichen
        for (const [t0, t1] of [[0.645, 0.713], [0.717, 0.783], [0.787, 0.855]]) faceQuad(F.P, F.Q, t0, t1, F.H * 0.2, F.H * 0.44, C('#f7efdc'));
        faceQuad(F.P, F.Q, 0.645, 0.855, F.H * 0.41, F.H * 0.44, C('#2d2d38'));
        const m = faceAt(F, 0.75, F.H * 0.3);
        g.beginPath(); g.ellipse(m[0], m[1], 1.5 * z, 1.1 * z, 0, 0, Math.PI); g.fillStyle = C('#c0392b'); g.fill();
      }
      // Pagodendach und Laternen an den drei vorderen Ecken
      const E = pagodaEaves(K, B).slice().sort((p, q) => p.d - q.d);
      for (const c of E.slice(1)) paperLantern(c.p[0], c.p[1] + 1.5 * z, z, L);
    }], [-0.08, 0, () => {
      const [px, py] = K.P(-0.08, 0, H0 + RH);
      noodleBowl(px, py - 8 * z, z, now);
    }], [0.42, -0.38, () => {                                                                // Nobori-Fahne
      const top = kPost(K, 0.42, -0.38, 21, '#2d2d38', 0.9);
      kLine(K, top, [top[0] + 4.6 * z, top[1]], '#2d2d38', 0.7);
      g.fillStyle = C('#f7efdc'); g.fillRect(top[0] + 0.5 * z, top[1] + 0.4 * z, 4 * z, 12 * z);
      g.fillStyle = C('#c0392b'); g.fillRect(top[0] + 0.5 * z, top[1] + 0.4 * z, 4 * z, 2 * z); g.fillRect(top[0] + 0.5 * z, top[1] + 10.8 * z, 4 * z, 1.6 * z);
      circle(top[0] + 2.5 * z, top[1] + 6.4 * z, 1.4 * z, C('#c0392b'));
    }]]);
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Konditorei: zuckerwatte-rosa Haus, schokobraunes Dach mit Zuckerguss-Kante, dreistöckige Torte mit Erdbeere und
  // Kerze auf dem Dach, Tortenvitrine im Schaufenster, Tischchen mit rosa Schirm.
  // ---------------------------------------------------------------------------------------------------------------
  function icingEaves(K, B) {
    const z = K.z, E = eaveCorners(K, B), col = C('#fffaf5');
    for (let i = 0; i < 4; i++) {
      const A = E[i].p, Q = E[(i + 1) % 4].p, front = K.facing(...EDGE_N[i]) > 0.01;
      g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = (front ? 1.7 : 1.1) * z;
      g.beginPath(); g.moveTo(...A); g.lineTo(...Q); g.stroke();
      if (!front) continue;
      const n = 8;
      for (let j = 0; j < n; j++) {                                      // Bögen entlang der Traufe
        const m = lerp(A, Q, (j + 0.5) / n);
        g.beginPath(); g.ellipse(m[0], m[1] + 0.3 * z, 1.9 * z, 1.6 * z, 0, 0, Math.PI); g.fillStyle = col; g.fill();
        if ((j + i) % 3 === 1) ellipse(m[0], m[1] + 2.4 * z, 0.75 * z, 1.4 * z, col);   // Tropfen
      }
    }
  }
  function cakeTier(x, base, rx, h, side, top, drip, z) {               // Stockwerk einer Torte (base: Boden, Mitte vorn)
    const ry = rx * 0.38;
    ellipse(x, base, rx, ry, C(shade(side, -0.08)));
    g.fillStyle = C(side); g.fillRect(x - rx, base - h, rx * 2, h);
    g.fillStyle = C(shade(side, -0.08)); g.fillRect(x + rx * 0.55, base - h, rx * 0.45, h);   // Schattenseite
    ellipse(x, base - h, rx, ry, C(top));
    for (let i = -3; i <= 3; i++) {                                      // Guss läuft vorn über den Rand
      const dx = i / 3.4, px = x + dx * rx, py = base - h + ry * Math.sqrt(1 - dx * dx);
      ellipse(px, py + 0.4 * z, rx / 7, (i & 1 ? 1.5 : 0.9) * z, C(drip));
    }
  }
  function tieredCake(x, y, z, now, L) {                                  // (x, y): Boden der Torte
    const h1 = 6 * z, h2 = 5 * z, h3 = 4.5 * z;
    ellipse(x, y + 0.6 * z, 11.5 * z, 4.3 * z, C('#fffaf5'));            // Tortenplatte
    cakeTier(x, y, 10 * z, h1, '#f7a8c4', '#fffaf5', '#fffaf5', z);
    for (let i = 0; i < 5; i++) circle(x + (i - 2) * 3.8 * z, y - h1 - 1.6 * z + Math.abs(i - 2) * 0.9 * z, 0.9 * z, C('#e8384f'));   // Beeren
    cakeTier(x, y - h1, 7 * z, h2, '#fff4e6', '#f7a8c4', '#f7a8c4', z);
    cakeTier(x, y - h1 - h2, 4.5 * z, h3, '#f7a8c4', '#fffaf5', '#fffaf5', z);
    const ty = y - h1 - h2 - h3;
    // Erdbeere
    const ex = x - 1.3 * z, ey = ty - 1.8 * z;
    g.beginPath(); g.moveTo(ex - 2.2 * z, ey - 0.8 * z); g.quadraticCurveTo(ex, ey - 2.6 * z, ex + 2.2 * z, ey - 0.8 * z); g.quadraticCurveTo(ex + 1.8 * z, ey + 2 * z, ex, ey + 2.8 * z);
    g.quadraticCurveTo(ex - 1.8 * z, ey + 2 * z, ex - 2.2 * z, ey - 0.8 * z); g.fillStyle = C('#e8384f'); g.fill();
    poly([[ex - 1.8 * z, ey - 1.2 * z], [ex, ey - 2.8 * z], [ex + 1.8 * z, ey - 1.2 * z], [ex, ey - 1.7 * z]], C('#58b36a'));
    for (const [dx, dy] of [[-0.8, 0], [0.8, 0.2], [0, 1.2], [-0.5, 1.8], [0.6, 1.5]]) circle(ex + dx * z, ey + dy * z, 0.25 * z, C('#ffe28a'));
    // Kerze
    const cx = x + 1.9 * z, cb = ty - 0.2 * z;
    g.fillStyle = C('#fffaf5'); g.fillRect(cx - 0.6 * z, cb - 6 * z, 1.2 * z, 6 * z);
    g.fillStyle = C('#f28cb1'); for (let i = 0; i < 3; i++) g.fillRect(cx - 0.6 * z, cb - (1.4 + i * 2) * z, 1.2 * z, 0.8 * z);
    const fl = Math.sin(now / 160) * 0.25 * z;
    oval(cx + fl * 0.5, cb - 7.4 * z, 1 * z, 1.7 * z + fl, 0, L ? '#fff3b0' : C('#ffb13b'));
    oval(cx + fl * 0.5, cb - 7 * z, 0.45 * z, 0.8 * z, 0, L ? '#ffffff' : C('#fff3b0'));
    if (L) kGlow(cx, cb - 7.4 * z, z, 12);
  }
  SHOP_ART.konditorei = function (K, s, now, x, y, t) {
    const z = K.z, L = lit(), H0 = 20, RH = 10;
    K.scene([[-0.08, 0, () => {
      const B = shopHouse(K, { wall: '#fde8ef', roof: '#7b4a2e', awning: null, roofType: 'hip', h: H0, roofH: RH, trim: '#f28cb1' });
      for (const F of Object.values(B.faces)) if (F) faceQuad(F.P, F.Q, 0, 1, 0, Math.min(2.4 * z, F.H * 0.12), C('#f6b3c8'));   // rosa Sockel
      const F = B.faces.front;
      stripedAwning(K, B, ['#f28cb1', '#fffaf5'], 8);
      if (F) {
        faceQuad(F.P, F.Q, 0.1, 0.56, F.H * 0.12, F.H * 0.15, C('#fffaf5'));             // Vitrine: Bord mit Törtchen
        [[0.18, '#f7a8c4', '#fffaf5', 2], [0.33, '#7b4a2e', '#f7a8c4', 3], [0.48, '#fff4e6', '#e8384f', 2]].forEach(([tt, side, top, hh]) => {
          const p = faceAt(F, tt, F.H * 0.15), w = 1.8 * z;
          g.fillStyle = C(side); g.fillRect(p[0] - w, p[1] - hh * z, w * 2, hh * z);
          ellipse(p[0], p[1], w, w * 0.4, C(side));
          ellipse(p[0], p[1] - hh * z, w, w * 0.4, C(top));
          circle(p[0], p[1] - (hh + 0.8) * z, 0.6 * z, C('#e8384f'));
        });
      }
      icingEaves(K, B);
    }], [-0.08, 0, () => {
      const [px, py] = K.P(-0.08, 0, H0 + RH);
      tieredCake(px, py + 1 * z, z, now, L);
    }], [0.42, -0.44, () => {                                                                // Tischchen mit rosa Schirm
      const [px, py] = K.P(0.42, -0.44), top = py - 11 * z;
      kLine(K, [px, py], [px, top], '#8a6a4a', 0.9);
      ellipse(px, py - 4.2 * z, 3.6 * z, 1.5 * z, C('#fffaf5'));
      poly([[px - 7 * z, top + 2.2 * z], [px, top - 3 * z], [px + 7 * z, top + 2.2 * z], [px, top + 5 * z]], C('#f28cb1'));
      poly([[px, top - 3 * z], [px + 7 * z, top + 2.2 * z], [px, top + 5 * z]], C('#e27aa0'));
      poly([[px - 2.6 * z, top - 1 * z], [px, top - 3 * z], [px + 2.6 * z, top - 1 * z], [px, top + 0.6 * z]], C('#fffaf5'));
    }]]);
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Chocolaterie: zartbitterbraunes Haus mit Rosé-Mansarddach und Gold, aufrechte Schokoladentafel (angebissen, halb in
  // Goldfolie) auf dem Dach, Pralinen-Schachteln im Schaufenster, Kundenstopper mit Goldherz, Kugelbäumchen im Goldtopf.
  // ---------------------------------------------------------------------------------------------------------------
  const GOLD = '#d4af37';
  function chocolateBar(x, y, z) {                                         // (x, y): Fuß der Tafel, Mitte
    const w = 6.5 * z, top = -19 * z, foil = -9.5 * z, dx = 2.4 * z, dy = -1.4 * z, bite = 4.6 * z;
    g.save(); g.translate(x, y); g.rotate(-0.14);
    // Dicke: rechte Seite und Oberkante
    poly([[w, 0], [w + dx, dy], [w + dx, foil + dy], [w, foil]], C('#9e7d1f'));
    poly([[w, foil], [w + dx, foil + dy], [w + dx, top + dy], [w, top]], C('#3a1f10'));
    poly([[-w + bite, top], [w, top], [w + dx, top + dy], [-w + bite + dx, top + dy]], C('#8a5230'));
    // Schokolade mit Biss oben links
    const bp = (ang, r) => [-w + Math.cos(ang) * r, top + Math.sin(ang) * r];   // Biss: zwei Zahnbögen um die Ecke
    g.beginPath(); g.moveTo(-w, foil); g.lineTo(...bp(Math.PI / 2, bite));
    g.quadraticCurveTo(...bp(Math.PI * 3 / 8, bite * 1.35), ...bp(Math.PI / 4, bite));
    g.quadraticCurveTo(...bp(Math.PI / 8, bite * 1.35), ...bp(0, bite));
    g.lineTo(w, top); g.lineTo(w, foil); g.closePath();
    g.fillStyle = C('#5e331c'); g.fill();
    g.save(); g.clip();
    const cw = (2 * w) / 3, ch = 4.6 * z;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x0 = -w + c * cw + 0.7 * z, y0 = top + r * ch + 0.7 * z, pw = cw - 1.4 * z, ph = ch - 1.4 * z;
      g.fillStyle = C('#8a5230'); g.fillRect(x0, y0, pw, ph);
      g.fillStyle = C('#a8683f'); g.fillRect(x0, y0, pw, 0.8 * z); g.fillRect(x0, y0, 0.8 * z, ph);   // Kante im Licht
    }
    g.restore();
    // Goldfolie mit Knitterkante
    g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w, foil + 0.4 * z);
    for (let i = 1; i <= 6; i++) g.lineTo(-w + i * (2 * w / 6), foil + (i & 1 ? -1.1 : 0.5) * z);
    g.lineTo(w, 0); g.closePath(); g.fillStyle = C(GOLD); g.fill();
    for (const [a, b] of [[-4.5, -1.5], [-1, -6], [2.5, -2.5]]) { g.fillStyle = C('#f5de8a'); g.fillRect(a * z, b * z, 1 * z, 3.2 * z); }   // Glanz
    g.fillStyle = C('#f3a6c1'); g.fillRect(-w, -5.4 * z, 2 * w, 2.6 * z);                                            // Banderole in Rosé
    g.fillStyle = C('#e38aab'); g.fillRect(w, -5.4 * z, dx, 2.6 * z);
    const hx = 0, hy = -4.1 * z;                                                                                       // Goldherz
    circle(hx - 0.6 * z, hy - 0.3 * z, 0.75 * z, C(GOLD)); circle(hx + 0.6 * z, hy - 0.3 * z, 0.75 * z, C(GOLD));
    poly([[hx - 1.3 * z, hy], [hx + 1.3 * z, hy], [hx, hy + 1.3 * z]], C(GOLD));
    g.restore();
  }
  SHOP_ART.chocolaterie = function (K, s, now, x, y, t) {
    const z = K.z, H0 = 20, RH = 11;
    K.scene([[-0.08, 0, () => {
      const B = shopHouse(K, { wall: '#5a3420', roof: '#f3a6c1', awning: null, roofType: 'mansard', h: H0, roofH: RH, trim: GOLD });
      for (const F of Object.values(B.faces)) if (F) {
        faceQuad(F.P, F.Q, 0, 1, F.H - 1.6 * z, F.H - 0.4 * z, C(GOLD));                       // Goldgesims
        faceQuad(F.P, F.Q, 0, 0.03, 0, F.H, C(GOLD)); faceQuad(F.P, F.Q, 0.97, 1, 0, F.H, C(GOLD));   // Goldkanten
      }
      stripedAwning(K, B, [GOLD, '#6b3a22'], 8);
      const F = B.faces.front;
      if (F) {
        // Pralinen-Schachteln: rosa mit Goldschleife, daneben eine offene Schachtel mit drei Pralinen
        faceQuad(F.P, F.Q, 0.14, 0.29, F.H * 0.1, F.H * 0.26, C('#f3a6c1'));
        faceQuad(F.P, F.Q, 0.205, 0.225, F.H * 0.1, F.H * 0.26, C(GOLD));
        faceQuad(F.P, F.Q, 0.14, 0.29, F.H * 0.17, F.H * 0.19, C(GOLD));
        const bow = faceAt(F, 0.215, F.H * 0.26);
        circle(bow[0] - 0.9 * z, bow[1] - 0.5 * z, 0.8 * z, C(GOLD)); circle(bow[0] + 0.9 * z, bow[1] - 0.5 * z, 0.8 * z, C(GOLD));
        faceQuad(F.P, F.Q, 0.34, 0.52, F.H * 0.1, F.H * 0.17, C(GOLD));
        faceQuad(F.P, F.Q, 0.35, 0.51, F.H * 0.15, F.H * 0.17, C('#3b2417'));
        [[0.38, '#3a1f10'], [0.43, '#a8683f'], [0.48, '#f3e3cc']].forEach(([tt, col]) => {
          const p = faceAt(F, tt, F.H * 0.18);
          circle(p[0], p[1] - 0.6 * z, 1.1 * z, C(col)); circle(p[0] - 0.3 * z, p[1] - 1 * z, 0.3 * z, C(GOLD));
        });
        const k = faceAt(F, 0.83, F.H * 0.22); circle(k[0], k[1], 0.6 * z, C(GOLD));   // Türknauf
      }
    }], [-0.08, 0, () => {
      const [px, py] = K.P(-0.08, 0, H0 + RH);
      chocolateBar(px, py + 1.5 * z, z);
    }], [0.42, -0.4, () => {                                                                 // Kundenstopper mit Goldherz
      const B = K.block({ a: 0.42, b: -0.4, ha: 0.022, hb: 0.075, h: 8, wall: '#3b2417', type: 'flat', roof: GOLD });
      const F = shownFace(B);
      if (F) {
        faceQuad(F.P, F.Q, 0.15, 0.85, F.H * 0.35, F.H * 0.9, C('#2a1a10'));
        const m = faceAt(F, 0.5, F.H * 0.66);
        circle(m[0] - 0.7 * z, m[1] - 0.3 * z, 0.85 * z, C(GOLD)); circle(m[0] + 0.7 * z, m[1] - 0.3 * z, 0.85 * z, C(GOLD));
        poly([[m[0] - 1.5 * z, m[1]], [m[0] + 1.5 * z, m[1]], [m[0], m[1] + 1.6 * z]], C(GOLD));
      }
    }], [0.38, 0.44, () => {                                                                 // Kugelbäumchen im Goldtopf
      const [px, py] = K.P(0.38, 0.44);
      g.fillStyle = C('#b8912a'); g.fillRect(px - 2 * z, py - 3.5 * z, 4 * z, 3.5 * z);
      ellipse(px, py - 3.5 * z, 2.2 * z, 0.9 * z, C(GOLD));
      kLine(K, [px, py - 3.5 * z], [px, py - 8 * z], '#6b3a22', 0.8);
      circle(px, py - 10.5 * z, 3.4 * z, C('#4f8f3a')); circle(px - 1 * z, py - 11.5 * z, 1.8 * z, C('#6aab4f'));
    }]]);
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Spielzeugladen: sonnengelbes Haus, blaues Dach, Regenbogen-Markise, Teddy sitzt auf dem Dach, daneben ein Windrad;
  // vorn Luftballons an einem Geschenk, Bauklötze.
  // ---------------------------------------------------------------------------------------------------------------
  function teddy(x, y, z) {                                                // (x, y): Sitzfläche, Mitte
    const fur = C('#b5793f'), light = C('#ecc99b'), dark = C('#3b2a20');
    oval(x - 6.2 * z, y - 7.5 * z, 2.3 * z, 3.8 * z, 0.5, C('#a86d36'));      // Arme
    oval(x + 6.2 * z, y - 7.5 * z, 2.3 * z, 3.8 * z, -0.5, C('#9c6230'));
    oval(x, y - 6.5 * z, 6.3 * z, 7 * z, 0, fur);                              // Körper
    oval(x + 3.2 * z, y - 5.5 * z, 2.6 * z, 5.5 * z, 0, C('#a86d36'));
    oval(x, y - 5.5 * z, 3.9 * z, 4.5 * z, 0, light);                          // Bauch
    for (const sx of [-1, 1]) {                                                // Beine mit Tatzen
      oval(x + sx * 4 * z, y - 1.4 * z, 3.2 * z, 2.4 * z, 0, sx < 0 ? fur : C('#a86d36'));
      oval(x + sx * 5.1 * z, y - 1.3 * z, 1.5 * z, 1.8 * z, 0, light);
    }
    for (const sx of [-1, 1]) { circle(x + sx * 4.3 * z, y - 21.3 * z, 2.3 * z, fur); circle(x + sx * 4.3 * z, y - 21.3 * z, 1.2 * z, light); }   // Ohren
    circle(x, y - 17.3 * z, 5.6 * z, fur);                                     // Kopf
    oval(x - 1.8 * z, y - 19.8 * z, 1.8 * z, 1.1 * z, -0.4, C('#c98d5c'));
    oval(x, y - 15.6 * z, 2.7 * z, 2 * z, 0, light);                          // Schnauze
    oval(x, y - 16.3 * z, 1.1 * z, 0.75 * z, 0, dark);
    kLine({ z }, [x, y - 15.6 * z], [x, y - 14.6 * z], '#3b2a20', 0.45);
    for (const sx of [-1, 1]) {
      circle(x + sx * 2.1 * z, y - 18.8 * z, 0.8 * z, dark); circle(x + sx * 2.1 * z - 0.25 * z, y - 19.1 * z, 0.28 * z, C('#ffffff'));
      circle(x + sx * 3.5 * z, y - 16 * z, 0.9 * z, C('#f4a7a0'));
    }
    poly([[x, y - 12.4 * z], [x - 3.2 * z, y - 14 * z], [x - 3.2 * z, y - 10.8 * z]], C('#e8604f'));   // Fliege
    poly([[x, y - 12.4 * z], [x + 3.2 * z, y - 14 * z], [x + 3.2 * z, y - 10.8 * z]], C('#d24f40'));
    circle(x, y - 12.4 * z, 0.9 * z, C('#ff8a70'));
  }
  function pinwheel(x, y, z, now) {                                        // (x, y): Fuß des Stiels
    const hub = [x, y - 17 * z], R = 6 * z, rot = now / 380;
    kLine({ z }, [x, y], hub, '#f5f0e6', 1);
    const cols = ['#e8604f', '#ffd23f', '#3e7fd0', '#58b36a'];
    for (let i = 0; i < 4; i++) {
      const a = rot + i * Math.PI / 2, tip = [hub[0] + Math.cos(a) * R, hub[1] + Math.sin(a) * R * 0.92];
      const side = [hub[0] + Math.cos(a + 1.1) * R * 0.62, hub[1] + Math.sin(a + 1.1) * R * 0.62 * 0.92];
      const mid = [hub[0] + Math.cos(a + 0.45) * R * 0.55, hub[1] + Math.sin(a + 0.45) * R * 0.55 * 0.92];
      poly([hub, tip, side], C(cols[i]));
      poly([hub, tip, mid], C(shade(cols[i], 0.3)));
    }
    circle(hub[0], hub[1], 1 * z, C('#ffffff'));
  }
  function balloonBunch(K, a, b, now) {
    const [x, y] = K.P(a, b), z = K.z;
    const B = K.block({ a, b, ha: 0.045, hb: 0.045, h: 4, wall: '#e8604f', type: 'flat', roof: '#ff8a70' });   // Geschenk als Gewicht
    for (const F of Object.values(B.faces)) if (F) faceQuad(F.P, F.Q, 0.42, 0.58, 0, F.H, C('#ffd23f'));
    const knot = [x, y - 4 * z];
    const cols = ['#e8604f', '#3e7fd0', '#ffd23f', '#58b36a', '#c77dff'];
    const spots = [[-4.5, -19], [4, -20.5], [0, -25], [-6, -26], [5.5, -27.5]];
    spots.forEach(([dx, dy], i) => {
      const bx = x + dx * z + Math.sin(now / 900 + i * 1.7) * 0.8 * z, by = y + dy * z + Math.sin(now / 1300 + i) * 0.5 * z;
      kLine(K, knot, [bx, by + 3 * z], '#8a8f99', 0.35);
      oval(bx, by, 2.5 * z, 3.1 * z, 0, C(cols[i]));
      oval(bx - 0.8 * z, by - 1.1 * z, 0.6 * z, 1 * z, -0.4, C(shade(cols[i], 0.5)));
      poly([[bx, by + 2.9 * z], [bx - 0.6 * z, by + 3.7 * z], [bx + 0.6 * z, by + 3.7 * z]], C(cols[i]));
    });
  }
  SHOP_ART.spielzeug = function (K, s, now, x, y, t) {
    const z = K.z, H0 = 20, RH = 10;
    K.scene([[-0.08, 0, () => {
      const B = shopHouse(K, { wall: '#ffe08a', roof: '#3e7fd0', awning: null, roofType: 'hip', h: H0, roofH: RH, trim: '#3e7fd0' });
      for (const F of Object.values(B.faces)) if (F) {                                     // bunte Punkte unterm Dach
        for (let i = 0; i < 6; i++) { const p = faceAt(F, 0.1 + i * 0.16, F.H * 0.93); circle(p[0], p[1], 0.8 * z, C(['#e8604f', '#3e7fd0', '#58b36a'][i % 3])); }
      }
      stripedAwning(K, B, ['#e8604f', '#ff9f43', '#ffd23f', '#58b36a', '#3e7fd0', '#8e6bd8']);
      const F = B.faces.front;
      if (F) {                                                                               // Schaufenster: Ball und Bauklötze
        const p = faceAt(F, 0.2, F.H * 0.19);
        circle(p[0], p[1], 1.9 * z, C('#e8604f'));
        g.fillStyle = C('#fffaf0'); g.fillRect(p[0] - 1.9 * z, p[1] - 0.4 * z, 3.8 * z, 0.8 * z);
        faceQuad(F.P, F.Q, 0.3, 0.37, F.H * 0.09, F.H * 0.19, C('#3e7fd0'));
        faceQuad(F.P, F.Q, 0.38, 0.45, F.H * 0.09, F.H * 0.19, C('#58b36a'));
        faceQuad(F.P, F.Q, 0.34, 0.41, F.H * 0.19, F.H * 0.29, C('#ffd23f'));
        faceQuad(F.P, F.Q, 0.47, 0.53, F.H * 0.09, F.H * 0.3, C('#c77dff'));
      }
    }], [-0.08, 0, () => {
      const [px, py] = K.P(-0.08, 0, H0 + RH);
      pinwheel(px + 10.5 * z, py + 6 * z, z, now);
      teddy(px - 2 * z, py + 2 * z, z);
    }], [0.4, -0.3, () => balloonBunch(K, 0.4, -0.3, now)],
    [0.34, 0.42, () => {                                                                        // Bauklötze
      K.block({ a: 0.32, b: 0.38, ha: 0.05, hb: 0.05, h: 4.5, wall: '#3e7fd0', type: 'flat', roof: '#6fa3e8' });
      K.block({ a: 0.36, b: 0.47, ha: 0.05, hb: 0.05, h: 4.5, wall: '#e8604f', type: 'flat', roof: '#ff8a70' });
      K.block({ a: 0.34, b: 0.425, ha: 0.05, hb: 0.05, h: 4.5, lift: 4.5, wall: '#58b36a', type: 'flat', roof: '#8fd08a' });
    }]]);
  };
})();
