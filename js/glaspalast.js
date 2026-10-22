'use strict';
// ---------------------------------------------------------------------------
// 🏛️ Glaspalast (Prachtbau, Block 161f, Nutzer 22.10.2026): nach dem Grand Palais – Steinflügel mit Säulenreihe, Balustrade mit
// Flügelpferden und Vasen, Vordach mit zwei Säulenreihen; dahinter die lange Glashalle (goldene Rippen in Stufe 3) und die Glaskuppel.
// Einmal im Spiel, 4×3, Taler, drei Stufen. Wirkung: „Dein Ausstellungsstück“ – ab Stufe 2 ist die Kuppel eine Vitrine, darin steht als
// Modell ein Stück, das man besitzt (Infofenster). Bild aus tools/prachtbauten-entwurf.js (grandpalais, abgenommen) – Änderungen dort zeigen.
// ---------------------------------------------------------------------------
const GLAS_STAGES = [
  { name: 'Glaspalast', look: 'Glashalle und Steinflügel' },
  { name: 'Großer Glaspalast', look: 'Säulen, Balustrade und eine Glaskuppel mit Vitrine', cost: { money: 3e9 } },
  { name: 'Prachtpalast', look: 'goldenes Glasdach, Flügelpferde und Vasen', cost: { money: 8e9 } },
];
ITEMS.glaspalast = { cat: 'deko', name: 'Glaspalast', size: [4, 3], cost: 1e9, needs: 'grass', h: 84, beauty: 120, festival: true, unique: true, the: 'Der Glaspalast',
  prachtStages: GLAS_STAGES, desc: 'Eine lange Glashalle hinter einer Säulenfassade. Ab Stufe 2 steht in der Glaskuppel dein Ausstellungsstück.' };
FX.glaspalast = '🖼️ dein Ausstellungsstück · 🌸 je Stufe';
ITEM_TIPS.glaspalast = 'Einmal im Spiel, braucht 4×3 Felder Wiese. Ab Stufe 2 wird die Kuppel eine Vitrine: Antippen und ein Stück zum Ausstellen wählen.';
{ const fz = MENU.find(m => m.id === 'freizeit'), kultur = fz && fz.groups.find(gr => gr.id === 'kultur'); if (kultur) kultur.items.push('glaspalast'); }

const GLAS_ART = (() => {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', GOLD_L = '#ffe9a0';
  const GLASS = '#bfe0ee', STONE2 = '#eadfca';
  const lit = () => night > 0.15 && isLive();
  const glowP = (p, r) => { const q = 0.4; glowQuad([[p[0] - q, p[1] + q], [p[0] + q, p[1] + q], [p[0] + q, p[1] - q], [p[0] - q, p[1] - q]], r); };
  const fRect = (F, t0, t1, h0, h1, fill) => poly([F(t0, h0), F(t1, h0), F(t1, h1), F(t0, h1)], fill);
  function arch(F, t0, t1, h0, h1, fill, span) {
    const tm = (t0 + t1) / 2, r = (t1 - t0) / 2, rise = (h1 - h0) * 0.22, pts = [F(t0, h0), F(t1, h0), F(t1, h1 - rise)];
    for (let i = 1; i < 12; i++) { const an = i / 12 * Math.PI; pts.push(F(tm + Math.cos(an) * r, h1 - rise + Math.sin(an) * rise)); }
    pts.push(F(t0, h1 - rise));
    poly(pts, fill);
    if (span) { g.strokeStyle = span; g.lineWidth = Math.max(0.5, 0.5 * F.z); g.beginPath(); g.moveTo(...F(tm, h0)); g.lineTo(...F(tm, h1)); g.stroke(); }
  }
  const wallOf = (K, fix, along, from, to, lift, axis) => {
    const f = (t, h) => axis === 'b' ? K.P(from + (to - from) * t, fix, lift + h) : K.P(fix, from + (to - from) * t, lift + h);
    f.z = K.z; return f;
  };
  function column(K, a, b, lift, h, col, gold) {
    const z = K.z, [px, py0] = K.P(a, b, lift), w = 2.3 * z, H = h * z, py = py0;
    ellipse(px, py, w * 1.2, w * 0.55, C(shade(col, -0.12)));          // Fuß: Radius ≈ 0,06 Felder – Säulen stehen mindestens so weit von Wand und Kante
    g.fillStyle = C(col); g.fillRect(px - w, py - H, w, H);
    g.fillStyle = C(shade(col, -0.18)); g.fillRect(px, py - H, w, H);
    for (const k of [-0.5, 0.5]) { g.fillStyle = C(shade(col, -0.06)); g.fillRect(px + k * w - 0.25 * z, py - H, 0.5 * z, H); }   // Kanneluren
    ellipse(px, py - H, w * 1.3, w * 0.55, C(gold ? GOLD : shade(col, 0.06)));
    box(px, py - H - 0.2 * z, w * 1.45, w * 0.7, 1.6 * z, gold ? GOLD : shade(col, 0.04), null, 0);
  }
  const ribStrip = (z, n, col, w = 0.55) => (t0, t1, pt, L) => {
    g.strokeStyle = C(col); g.lineWidth = Math.max(0.5, w * z); g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i <= n; i++) { const s = -L + 2 * L * i / n; for (let j = 0; j <= 4; j++) { const p = pt(s, t0 + (t1 - t0) * j / 4); j ? g.lineTo(...p) : g.moveTo(...p); } }   // Bögen quer
    for (let k = 1; k < 6; k++) { const th = Math.PI * k / 6; if (th >= t0 && th < t1) { g.moveTo(...pt(-L, th)); g.lineTo(...pt(L, th)); } }                  // Linien längs
    g.stroke();
  };

  function grandpalais(K, stufe = 3, opt = {}) {
    // Stufe 3 (Nutzer 22.10.): goldenes Glasdach und goldene Kuppel („geil“)
    // Blöcke mit Zierband: auf Flächen nach +a (Schatten) dunkler – K.block malt trim auf allen Seiten gleich hell (Prüfer: „Gold auf
    // Schattenseiten nicht abgedunkelt“)
    const TB = ({ trim, ...o }) => { const r = K.block(o); if (trim) for (const f of Object.values(r.faces)) if (f) faceQuad(f.P, f.Q, 0, 1, f.H - 1.4 * K.z, f.H, C(K.turn(...f.n)[0] > 0.5 ? shade(trim, LIGHT.side) : trim)); return r; };
    const z = K.z, s2 = stufe >= 2, s3 = stufe >= 3, RIB = '#7d8f96', RIBC = s3 ? GOLD_D : RIB, RIBW = s3 ? 0.75 : 0.6;
    TB({ a: 0, b: 0, ha: 1.95, hb: 1.45, h: 3, wall: '#cfc3a5', type: 'flat', roof: '#e2d8c0' });
    // Halle hinten: Steinwände, Glastonne längs; ab Stufe 2 die Kuppel als Vitrine mit dem Ausstellungsstück (opt.stueck)
    const hH = 12, htop = 3 + hH, hR = s2 ? 13 : 9, HA = 1.75, HB = 0.95, HBc = -0.45, show = true;
    const d0 = show ? -1 : -6, dr = show ? 7 : 10;                         // Tambour: Fuß und Höhe (Ausstellung: beginnt am First, sonst sah man Pfosten in der Halle)
    const [dx, dy] = K.P(0, HBc, htop + hR + d0), R = (show ? 0.7 : 0.62) * Math.SQRT2 * TW / 2 * z;   // Kuppel: Tambour steckt im Glasdach (Vitrine etwas größer)
    const domeRibs = (few = false) => {                                   // Rippen wie auf der Tonne: Meridiane und Ringe auf der sichtbaren Hälfte (Vitrine: weniger)
      const DH = 20 * z, y0 = dy - dr * z, dp = (lat, ph) => [dx + R * Math.cos(lat) * Math.sin(ph), y0 + R / 2 * Math.cos(lat) * Math.cos(ph) - DH * Math.sin(lat)];
      g.strokeStyle = C(RIBC); g.lineWidth = Math.max(0.5, RIBW * z); g.beginPath();
      const M = few ? 2 : 4, step = few ? Math.PI / 5 : Math.PI / 10;
      for (let m = -M; m <= M; m++) { const ph = m * step; for (let j = 0; j <= 12; j++) { const p = dp(Math.PI / 2 * j / 12, ph); j ? g.lineTo(...p) : g.moveTo(...p); } }
      for (const lat of few ? [0.7] : [0.35, 0.78]) for (let j = 0; j <= 24; j++) { const p = dp(lat, -Math.PI / 2 + Math.PI * j / 24); j ? g.lineTo(...p) : g.moveTo(...p); }
      g.stroke();
    };
    const lantern = () => { if (s3) { const t = dy - (dr + 20) * z; cyl(dx, t, 2.6 * z, 1.3 * z, 4 * z, GOLD); cone(dx, t - 4 * z, 3 * z, 1.5 * z, 3.5 * z, GOLD_D); circle(dx, t - 8.5 * z, 1.4 * z, lit() ? '#fff1a8' : C(GOLD_L)); } };
    // Halle immer gleich (Nutzer: das halb durchsichtige Glasdach „sieht scheiße aus“); bei 'ausstellung' ist nur die Kuppel eine Vitrine:
    // Boden auf Firsthöhe, Sockel, ein Modell (verkleinertes Spielbild, passend zur Kuppelhöhe), darüber Tambour und Kuppel halb durchsichtig
    TB({ a: 0, b: HBc, ha: HA, hb: HB, h: hH, lift: 3, wall: STONE2, roof: GLASS, roofH: hR, type: 'barrel', ridge: 'a', over: 1, strip: ribStrip(z, 16, RIBC, RIBW) });
    { // Dachende rechts: Glasrand zwischen rundem Giebel (0,94 R) und Rippe ganz füllen – sonst blieb hinten unten ein weißer Spalt
      const ep = (th, k) => K.P(HA, HBc + Math.cos(th) * HB * k, htop + Math.sin(th) * hR * k), N = 24, ring = [];
      for (let i = 0; i <= N; i++) ring.push(ep(Math.PI * i / N, 1)); for (let i = N; i >= 0; i--) ring.push(ep(Math.PI * i / N, 0.94));
      poly(ring, C(shade(GLASS, LIGHT.side)));
      g.strokeStyle = C(RIBC); g.lineWidth = Math.max(0.5, RIBW * z); g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= N; i++) { const p = ep(Math.PI * i / N, 1); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke();
    }
    if (s2 && !show) { cyl(dx, dy, R, R / 2, dr * z, STONE2); ellipse(dx, dy - dr * z, R * 1.06, R * 0.53, C(s3 ? GOLD : shade(STONE2, -0.1))); dome(dx, dy - dr * z, R, R / 2, 20 * z, GLASS); domeRibs(); lantern(); }
    if (s2 && show) {
      // Gerüst der Vitrine ringsum (Nutzer: „die goldenen Leisten gehen nicht ganz rum – das sieht man, weil das Glas durchsichtig ist“):
      // ein Rahmen aus 10 Meridianen, Tambour-Pfosten, Ringen; erst die hintere Hälfte (gedämpft, durchs Glas), dann Stück, Glas, vordere Hälfte
      const DH = 20 * z, y0 = dy - dr * z, NM = 10;
      const dp = (lat, ph) => [dx + R * Math.cos(lat) * Math.sin(ph), y0 + R / 2 * Math.cos(lat) * Math.cos(ph) - DH * Math.sin(lat)];
      const ringPt = (yy, ph) => [dx + R * Math.sin(ph), yy + R / 2 * Math.cos(ph)];
      const frame = front => {                                            // front: Teile mit cos φ ≥ 0 (zum Betrachter), sonst die Rückseite
        const inHalf = ph => (Math.cos(ph) >= -1e-6) === front, col = front ? RIBC : shade(RIBC, 0.25);
        g.lineCap = 'round'; g.strokeStyle = C(col); g.lineWidth = Math.max(0.5, (front ? RIBW : RIBW * 0.8) * z); g.beginPath();   // rund: Teilstücke stoßen ohne Fuge aneinander
        for (let m = 0; m < NM; m++) { const ph = m * 2 * Math.PI / NM; if (!inHalf(ph)) continue;
          for (let j = 0; j <= 12; j++) { const p = dp(Math.PI / 2 * j / 12, ph); j ? g.lineTo(...p) : g.moveTo(...p); }       // Meridian
          const [x, y] = ringPt(dy, ph); g.moveTo(x, y); g.lineTo(x, y - dr * z); }                                          // Pfosten
        // Ring: jedes Teilstück gehört zu der Hälfte, in der seine Mitte liegt – sonst fehlte an den Seiten je ein Stück zwischen vorn und hinten
        const arc = (fn) => { for (let j = 0; j < 48; j++) { if (!inHalf(2 * Math.PI * (j + 0.5) / 48)) continue; g.moveTo(...fn(2 * Math.PI * j / 48)); g.lineTo(...fn(2 * Math.PI * (j + 1) / 48)); } };
        arc(ph => dp(0.7, ph)); arc(ph => ringPt(dy, ph));                // Ring auf der Kuppel, Fußring
        g.stroke();
        g.strokeStyle = C(s3 ? (front ? GOLD : shade(GOLD, 0.2)) : col); g.lineWidth = Math.max(0.5, (s3 ? 1.3 : RIBW) * z); g.beginPath();
        arc(ph => ringPt(dy - dr * z, ph)); g.stroke();                   // Kranz oben am Tambour
      };
      ellipse(dx, dy, R, R / 2, C(shade(STONE2, -0.02)));                // Boden der Vitrine
      frame(false);
      cyl(dx, dy - 0.2 * z, R * 0.42, R * 0.21, 2.5 * z, shade(STONE2, 0.05));       // Sockel
      ellipse(dx, dy - 2.7 * z, R * 0.43, R * 0.215, C(s3 ? GOLD : shade(STONE2, 0.1)));
      const id = opt.stueck && ITEMS[opt.stueck] ? opt.stueck : null;
      if (id) { const [fw, fh] = ITEMS[id].size || [1, 1], sc = Math.min(0.55, 27 / (ITEMS[id].h || 60), 1.1 / Math.max(fw, fh)); if (lit()) glowP([dx, dy - 12 * z], 30 * z); drawObject(id, dx, dy - 2.7 * z, z * sc, 1e6, 0, 0, 1, { b: id, rot: 0 }); }   // Modell passt in die Kuppel (Höhe und Grundfläche)
      g.globalAlpha = 0.2; cyl(dx, dy, R, R / 2, dr * z, GLASS); dome(dx, dy - dr * z, R, R / 2, 20 * z, GLASS); g.globalAlpha = 1;
      frame(true);
      lantern();
    }
    // Steinflügel vorn (+b): Säulenreihe, Bogentor in der Mitte, Attika
    const fH = 15, fb = 0.85, fhb = 0.26;                                  // weiter zurück: das Vordach mit zwei Säulenreihen und die Stufen bleiben in der Grundfläche
    TB({ a: 0, b: fb, ha: 1.85, hb: fhb, h: fH, lift: 3, wall: STONE2, type: 'flat', roof: shade(STONE2, 0.06), trim: s3 ? GOLD : shade(STONE2, -0.08) });
    const Fb = wallOf(K, fb + fhb, 'a', -1.85, 1.85, 3, 'b'), Fa = wallOf(K, 1.85, 'b', fb - fhb, fb + fhb, 3, 'a');
    for (let i = 0; i < 12; i++) { const t = 0.04 + i * 0.08; if (t > 0.36 && t < 0.64) continue; arch(Fb, t, t + 0.045, 3, 11, C('#9fc3e3')); }
    // Tor des Vordachs in der Wand – vor allen Säulen gezeichnet (sie stehen davor)
    const pHa = 0.46, Fp = wallOf(K, fb + fhb, 'a', -pHa, pHa, 3, 'b');   // Torwand = Wand des Flügels hinter den Säulen
    if (s3) arch(Fp, 0.26, 0.74, 0, 12.8, C(GOLD));                         // Goldrahmen ums Tor
    arch(Fp, 0.28, 0.72, 0, 12.2, C(shade('#8a5a3c', 0.05)));               // Tor: zwei Flügel (unter dem Gebälk)
    fRect(Fp, 0.497, 0.503, 0, 7.4, C(shade('#8a5a3c', -0.2)));
    arch(Fp, 0.33, 0.67, 7.6, 11.7, C('#9fc3e3'));                          // Oberlicht im Bogen
    const PCOL_A = [-0.4, -0.135, 0.135, 0.4];                              // Säulen des Vordachs (je Reihe)
    // Säulenreihe vor der Fassade (Paare zwischen den Fenstern), von hinten nach vorn
    const cols = []; for (let i = 0; i <= 12; i++) { const t = 0.02 + i * 0.08; if (t > 0.36 && t < 0.64) continue; cols.push(-1.85 + 3.7 * t); }
    if (s2) {                                                             // Stufe 2: Säulenreihe mit Gebälk
      // hintere Reihe des Vordachs steht auf derselben Linie und gehört hierher – nach dem Gebälk gezeichnet lagen ihre Kapitelle darüber
      [...cols, ...PCOL_A].sort((p, q) => K.depth(p, fb + fhb + 0.07) - K.depth(q, fb + fhb + 0.07)).forEach(a => column(K, a, fb + fhb + 0.07, 3, fH - 2, '#f6efe0', s3));   // 0,07 vor der Wand: der Fuß ragt nicht in sie hinein
      TB({ a: 0, b: fb + fhb + 0.02, ha: 1.85, hb: 0.08, h: 2.2, lift: 3 + fH - 2, wall: STONE2, type: 'flat', roof: shade(STONE2, 0.06), trim: s3 ? GOLD : null });   // Gebälk über den Säulen
    }
    // Dach des Steinflügels (Nutzer 22.10.: „so ein Geländer oben, das machen solche Gebäude da immer – dann Figuren auf Sockel, aber
    // übertreibs nicht“): ab Stufe 2 Terrasse mit Balustrade vorn und an der rechten Seite, vier Postamente (Ecken, neben dem Portikus);
    // Stufe 3: Flügelpferde auf den Ecken, Vasen innen. Stufe 1: schlichte Attika.
    // Reihenfolge (Nutzer: „schau, welche Linien vorne und welche hinten liegen“): alles hier liegt hinter dem Portikus, darum vor ihm;
    // Balustraden-Stücke und Postamente nach ihrer Tiefe (a + b) von hinten nach vorn – ein Sockel überdeckt nie Säulchen weiter vorn
    const be = fb + fhb - 0.03, h0 = 3 + fH, BAL = 3.7, POST_H = 5.9, bBack = fb - fhb + 0.03, aSide = 1.81;
    const vase = (x, y, sc = 1) => {                                       // Amphora: Fuß, Bauch mit Glanz (Licht von links), Hals, Henkel, Deckel
      const u = z * sc;
      poly([[x - 1.2 * u, y], [x + 1.2 * u, y], [x + 0.7 * u, y - 1 * u], [x - 0.7 * u, y - 1 * u]], C(GOLD_D));
      ellipse(x, y - 3.6 * u, 2.4 * u, 2.9 * u, C(GOLD));
      ellipse(x - 0.8 * u, y - 4.4 * u, 0.7 * u, 1.5 * u, C(GOLD_L));
      poly([[x - 1 * u, y - 6 * u], [x + 1 * u, y - 6 * u], [x + 1.3 * u, y - 7.6 * u], [x - 1.3 * u, y - 7.6 * u]], C(GOLD_D));
      g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.5, 0.6 * u); g.beginPath();
      g.moveTo(x - 1.2 * u, y - 7.1 * u); g.quadraticCurveTo(x - 3.4 * u, y - 7.2 * u, x - 2.2 * u, y - 4.6 * u);
      g.moveTo(x + 1.2 * u, y - 7.1 * u); g.quadraticCurveTo(x + 3.4 * u, y - 7.2 * u, x + 2.2 * u, y - 4.6 * u); g.stroke();
      ellipse(x, y - 7.7 * u, 1.6 * u, 0.6 * u, C(GOLD)); circle(x, y - 8.6 * u, 0.7 * u, C(GOLD_L));
    };
    const pegasus = (px, py, s, dir = 1) => {                              // Flügelpferd, steigend, Seitenansicht; dir 1 = Kopf rechts
      const P = (x, y) => [px + dir * (x - 5) * s * z, py - y * s * z];
      poly([[5.0, 7.4], [3.0, 11.6], [4.4, 11.0], [3.8, 12.8], [5.4, 11.6], [5.2, 13.4], [6.6, 11.4], [6.6, 8.2]].map(q => P(...q)), C(GOLD_D));
      poly([[3.2, 0], [3.6, 3.2], [2.6, 5.4], [1.0, 4.4], [0.6, 5.2], [1.4, 6.4], [3.4, 6.8], [5.8, 7.6], [6.6, 9.4], [7.8, 10.6], [9.4, 10.0], [9.6, 9.3],
        [8.5, 9.0], [7.6, 8.2], [7.9, 7.1], [9.3, 7.6], [9.8, 6.7], [8.8, 6.5], [8.6, 5.6], [7.4, 5.4], [5.6, 4.9], [4.8, 3.0], [4.6, 0]].map(q => P(...q)), C(GOLD));
      poly([[5.4, 7.6], [3.6, 11.0], [4.6, 10.8], [4.4, 12.0], [5.6, 11.0], [5.8, 12.4], [6.4, 10.6], [6.2, 8.0]].map(q => P(...q)), C(GOLD_L));
      circle(...P(8.6, 9.9), 0.35 * s * z, C(GOLD_D));
    };
    if (!s2) TB({ a: 0, b: be, ha: 1.85, hb: 0.05, h: 2.6, lift: h0, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.1) });   // Stufe 1: Attika
    else {
      g.strokeStyle = C(shade(STONE2, -0.06)); g.lineWidth = Math.max(0.5, 0.35 * z); g.beginPath();      // Terrasse: Plattenfugen (liegen ganz unten)
      for (let a = -1.8; a <= 1.81; a += 0.15) { g.moveTo(...K.P(a, fb - fhb, h0)); g.lineTo(...K.P(a, be, h0)); }
      for (const b of [fb - 0.12, fb + 0.06]) { g.moveTo(...K.P(-1.85, b, h0)); g.lineTo(...K.P(1.85, b, h0)); } g.stroke();
      const STONE_B = shade(STONE2, 0.08), GAP = shade(STONE2, -0.22);
      // ein Stück Balustrade: Sockelleiste, Schatten dahinter, Säulchen (von hinten nach vorn), Handlauf
      const front = (a0, a1) => () => {                                   // vorn, Wand nach +b (Sonnenseite)
        const am = (a0 + a1) / 2, ha = (a1 - a0) / 2;
        TB({ a: am, b: be, ha, hb: 0.05, h: 0.8, lift: h0, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.08) });
        fRect(wallOf(K, be + 0.05, 'a', a0, a1, h0, 'b'), 0, 1, 0.8, BAL - 0.7, C(GAP));
        for (let a = a0 + 0.04; a < a1 - 0.02; a += 0.075) { const [x, y] = K.P(a, be + 0.05, h0 + 0.8), w = 0.42 * z;
          poly([[x - w * 0.7, y], [x + w * 0.7, y], [x + w * 1.25, y - 0.8 * z], [x + w * 0.55, y - (BAL - 1.5) * z], [x - w * 0.55, y - (BAL - 1.5) * z], [x - w * 1.25, y - 0.8 * z]], C(STONE_B)); }
        TB({ a: am, b: be, ha, hb: 0.05, h: 0.7, lift: h0 + BAL - 0.7, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.12), trim: s3 ? GOLD : null });
      };
      const side = (b0, b1, aS = aSide) => () => {                         // Seitenstück: sichtbar ist immer die Seite nach +a (rechts außen; links die Innenseite)
        const bm = (b0 + b1) / 2, hb = (b1 - b0) / 2, sh = c => shade(c, LIGHT.side);
        TB({ a: aS, b: bm, ha: 0.03, hb, h: 0.8, lift: h0, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.08) });
        fRect(wallOf(K, aS + 0.03, 'b', b0, b1, h0, 'a'), 0, 1, 0.8, BAL - 0.7, C(sh(GAP)));
        for (let b = b0 + 0.04; b < b1 - 0.02; b += 0.075) { const [x, y] = K.P(aS + 0.03, b, h0 + 0.8), w = 0.42 * z;
          poly([[x - w * 0.7, y], [x + w * 0.7, y], [x + w * 1.25, y - 0.8 * z], [x + w * 0.55, y - (BAL - 1.5) * z], [x - w * 0.55, y - (BAL - 1.5) * z], [x - w * 1.25, y - 0.8 * z]], C(sh(STONE_B))); }
        TB({ a: aS, b: bm, ha: 0.03, hb, h: 0.7, lift: h0 + BAL - 0.7, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.12), trim: s3 ? GOLD : null });
      };
      const post = (a, b, deco) => () => {                                // Postament über die Balustrade hinaus, Stufe 3 mit Figur
        TB({ a, b, ha: 0.075, hb: 0.09, h: POST_H, lift: h0, wall: shade(STONE2, 0.05), type: 'flat', roof: shade(STONE2, 0.12), trim: s3 ? GOLD : shade(STONE2, -0.06) });
        if (s3 && deco) deco(...K.P(a, b, h0 + POST_H));
      };
      // innere Sockel direkt neben dem Vordach – dazwischen blieben sonst Geländer-Reste zwischen Dachkante und Sockel sichtbar
      const POSTS = [[-1.78, be, (x, y) => pegasus(x, y, 1.25, -1)], [-0.5, be, (x, y) => vase(x, y, 0.9)], [0.5, be, (x, y) => vase(x, y, 0.9)], [1.78, be, (x, y) => pegasus(x, y, 1.25, 1)]];
      const parts = [];                                                   // [Tiefe, Zeichnen]
      const cuts = POSTS.map(p => p[0]);
      for (let i = 0; i + 1 < cuts.length; i++) { const a0 = cuts[i] + 0.075, a1 = cuts[i + 1] - 0.075; parts.push([(a0 + a1) / 2 + be, front(a0, a1)]); }
      const bS = bBack + 0.05, bE = be - 0.09;                            // Seitenstücke zwischen Endpfosten hinten und Eck-Postament vorn
      parts.push([aSide + (bS + bE) / 2, side(bS, bE)]);
      parts.push([-aSide + (bS + bE) / 2, side(bS, bE, -aSide)]);          // links: nur die Innenseite ist zu sehen
      for (const aS of [aSide, -aSide]) parts.push([aS + bBack, () => TB({ a: aS, b: bBack, ha: 0.045, hb: 0.05, h: BAL + 0.4, lift: h0, wall: shade(STONE2, 0.05), type: 'flat', roof: shade(STONE2, 0.12), trim: s3 ? GOLD : null })]);   // Endpfosten hinten
      for (const [a, b, deco] of POSTS) parts.push([a + b + 0.01, post(a, b, deco)]);
      parts.sort((p, q) => p[0] - q[0]).forEach(p => p[1]());
    }
    // Portikus als Vordach (Nutzer 22.10.: „kritisiere ihn selbst“ – war ein nackter Kasten; dann „darf weiter hervortreten, Säulen vorne und
    // hinten, hinten auf Linie mit den anderen – ein Vordach/Entree“): zwei Reihen hoher Säulen (hinten auf der Säulenlinie des Flügels)
    // tragen Gebälk und Giebeldach über die ganze Tiefe; in der Wand dahinter das Bogentor; davor zwei Stufen bis zur Kante der Grundfläche.
    // Reihenfolge: Tor (in der Wand, oben beim Flügel) → hintere Säulen mit denen des Flügels → Gebälk des Flügels → vordere Säulen →
    // Gebälk und Giebeldach des Vordachs → Stufen
    // Säulen und Gebälk genau so hoch wie am Flügel: das Gebälk läuft als ein Band durch und biegt nach vorn um das Vordach (vorher saß es
    // höher, das Band des Flügels stieß auf halber Höhe gegen die Säulen – Nutzer: „da wo die Leiste über den Säulen anbindet“)
    const ptop = 3 + fH - 2, pBack = fb + fhb + 0.07, pFront = 1.38;   // vorn 0,07 vor der Sockelkante (1,45)           // Unterkante Gebälk, Säulenreihen
    // Gebälk und Dach beginnen dort, wo das Gebälk des Flügels vorn endet (fb + fhb + 0,1) – reichten sie bis an die Wand, lag ihr hinteres
    // Stück (zuletzt gezeichnet) über dem Band des Flügels und stand an der Ecke versetzt heraus (Nutzer: „sieht das komisch aus?“)
    const pB0 = fb + fhb + 0.1, pcB = (pB0 + pFront + 0.04) / 2, pHb = (pFront + 0.04 - pB0) / 2;
    const pcols = []; for (const b of s2 ? [pFront] : [pBack, pFront]) for (const a of PCOL_A) pcols.push([a, b]);   // ab Stufe 2 steht die hintere Reihe schon beim Flügel
    pcols.sort((p, q) => K.depth(...p) - K.depth(...q)).forEach(([a, b]) => column(K, a, b, 3, ptop - 3, '#f6efe0', s3));
    TB({ a: 0, b: pcB, ha: pHa, hb: pHb, h: 2.2, lift: ptop, wall: STONE2, type: 'flat', roof: shade(STONE2, 0.06), trim: s3 ? GOLD : shade(STONE2, -0.08) });   // Gebälk
    TB({ a: 0, b: pcB, ha: pHa, hb: pHb, h: 0.01, lift: ptop + 2.2, wall: STONE2, roof: '#f4ecdd', roofH: 7, type: 'gable', ridge: 'b', over: 1.0 });   // Giebeldach, Dreieck nach vorn
    { const Fg = wallOf(K, pcB + pHb, 'a', -pHa, pHa, ptop + 2.2, 'b');                                    // Giebelrahmen
      g.strokeStyle = C(s3 ? GOLD : shade(STONE2, -0.12)); g.lineWidth = Math.max(0.5, 0.8 * z); g.lineJoin = 'round'; g.beginPath(); g.moveTo(...Fg(0, 0)); g.lineTo(...Fg(0.5, 7)); g.lineTo(...Fg(1, 0)); g.stroke(); }
    for (const [bb, hh, w] of [[1.4625, 2, 0.5], [1.4875, 1, 0.54]]) TB({ a: 0, b: bb, ha: w, hb: 0.0125, h: hh, wall: shade(STONE2, -0.1), type: 'flat', roof: shade(STONE2, 0.14) });   // Stufen bis zur Kante
    arch(Fa, 0.25, 0.75, 3, 11, C(shade('#9fc3e3', -0.1)));
    if (lit()) { glowP(Fp(0.5, 9), 24 * z); for (const t of [0.2, 0.8]) glowP(Fb(t, 7), 14 * z); }
  }
  return grandpalais;
})();
BIG_ART.glaspalast = (cx, cy, z, now, x, y, lvl, t) => GLAS_ART(kit(cx, cy, z, 0), Math.max(1, Math.min(3, lvl || 1)), { stueck: t && t.stueck });

// Ausstellungsstück: was man besitzt – im Basar Gekauftes (auch Monumente) und alles, was gerade gebaut steht; nichts Riesiges,
// keine Wege/Netze und nicht der Glaspalast selbst
const GLAS_NO = new Set(['glaspalast', 'oper', 'weg', 'schiene', 'lm', 'rathaus', 'truhe']);
function glasChoices() {
  const ids = new Set(state.sdItems || []);
  for (const t of state.tiles.values()) ids.add(t.b);
  for (const ds of state.decos.values()) for (const d of ds) if (d) ids.add(d.b);
  const ok = id => { const d = ITEMS[id], [w, h] = (d && d.size) || [1, 1];
    return !!d && !GLAS_NO.has(id) && !WONDERS[id] && !['netz', 'strom'].includes(d.cat) && !(d.cat === 'bau' && !isHome(id)) && !d.paint && !TERRAFORM[id] && w * h <= 9; };   // bis 3×3 passt als Modell in die Kuppel; keine Betriebe/Kraftwerke (die Liste wurde sonst sehr lang), Häuser ja
  return [...ids].filter(ok).sort((a, b) => ITEMS[a].name.localeCompare(ITEMS[b].name, 'de'));
}
function glasSetStueck(x, y, id) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || t.b !== 'glaspalast' || (t.lvl || 1) < 2) return false;
  if (id && !glasChoices().includes(id)) return false;
  if (id) t.stueck = id; else delete t.stueck;
  t.born = performance.now();
  groundVersion++; sfx('deco'); save();
  return true;
}
// Infofenster (ui.js openInfo): Stufe, Ausstellung, Ausbau
function glasInfoHtml(t) {
  if (t.b !== 'glaspalast') return '';
  const lvl = t.lvl || 1, nx = prachtNext(t), list = lvl >= 2 ? glasChoices() : [];
  return `<div class="label">${GLAS_STAGES[lvl - 1].name} · Stufe ${lvl} von ${GLAS_STAGES.length}</div>
    ${lvl >= 2 ? `<div class="label">🖼️ Ausstellungsstück in der Kuppel</div>
      <div class="looks">${list.map(id => `<button class="look${t.stueck === id ? ' on' : ''}" data-glas="${id}">${escHtml(ITEMS[id].name)}</button>`).join('')}
        ${t.stueck ? '<button class="look" data-glas="">Vitrine leeren</button>' : ''}</div>`
      : '<p class="muted">🖼️ Ab Stufe 2 wird die Kuppel eine Vitrine – darin stellst du ein Stück aus, das du besitzt.</p>'}
    ${nx ? `<div class="label">Nächste Stufe: ${nx.name}</div>
      <p class="muted">${nx.look[0].toUpperCase() + nx.look.slice(1)} · 🌸 +${ITEMS.glaspalast.beauty}.</p>
      <div class="stats">${costSpans(nx.cost.money, {})}</div>
      <div class="row"><button class="btn" id="p-pracht-up" ${canPay(nx.cost) ? '' : 'disabled'}>✨ Ausbauen</button></div>`
    : '<p class="ok">Höchste Stufe – prächtiger geht es nicht!</p>'}`;
}
