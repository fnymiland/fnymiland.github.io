'use strict';
// ---------------------------------------------------------------------------
// Aussehen der Oberfläche (Nutzer, 25.10.2026: „das ganze Spiel sieht KI-generiert aus – Pillen, Emojis, Kacheln“ →
// Entwurf tools/ui-welt.html, gewählt: „Hecke und Wolken gefallen mir beide – als Themes in den Einstellungen, Hecke als Standard“).
// Die Oberfläche kommt aus der Welt: Symbole zeichnet das Spiel selbst (eigene Zeichnungen + Gebäude ohne Bodenkachel),
// Fenster/Leisten sind gemalte Platten (Hecke rundum bzw. Wolke). Wahl je Gerät unter eigenem Schlüssel (nicht in GFX:
// die Grafik-Einstellungen bleiben, wie sie sind).
// Platten: lookSlab(el, rolle) malt in ein Bild, das ::before hinter dem Element zeigt (--slab, --slab-pad) – so übersteht
// es jedes innerHTML. Neu gemalt wird nur, wenn sich die Größe ändert (ResizeObserver) oder das Aussehen wechselt.
// ---------------------------------------------------------------------------
const UI_LOOK_KEY = 'kachelhausen_aussehen';
const UI_LOOKS = {
  hecke: { name: 'Hecke' },
  wolke: { name: 'Wolken' },
};
const UI_LOOK_DEFAULT = 'wolke';                                           // Standard (Nutzer 26.10.2026: „Wolken default“); gewählt bleibt gewählt
const uiLookOf = v => UI_LOOKS[v] ? v : UI_LOOK_DEFAULT;
let uiLookId = (() => {
  let v = null;
  try { v = localStorage.getItem(UI_LOOK_KEY); } catch (e) { /* privates Fenster */ }
  return uiLookOf(v);
})();
if (typeof document !== 'undefined' && document.body) document.body.classList.add('look-' + uiLookId);   // schon für den Ladebildschirm
function setUiLook(id) {
  if (!UI_LOOKS[id] || id === uiLookId) return;
  uiLookId = id;
  try { localStorage.setItem(UI_LOOK_KEY, id); } catch (e) { /* gilt bis zum Neuladen */ }
  applyUiLook();
}

// ---------- Platten ----------
// Rollen: paper (Fenster), btn (Hauptknopf), btn2 (Nebenknopf), bar (Bauleiste)
const SLAB_STYLE = {
  hecke: {
    paper: { top: '#f8f0dc', depth: 6, r: 18, j: 1.5, pad: 18, deco: 'hecke' },
    btn:   { top: '#c9673f', side: '#93432a', depth: 4, r: 9, j: 1.1, pad: 10 },
    btn2:  { top: '#e6cfa3', side: '#b48c5c', depth: 4, r: 9, j: 1.1, pad: 10 },
    bar:   { top: '#a77c52', depth: 6, r: 22, j: 2, pad: 20, deco: 'hecke', beet: true },
  },
  wolke: {
    paper: { top: '#ffffff', side: '#c7d4e8', depth: 7, r: 20, j: 2, step: 26, pad: 26, deco: 'wolke' },
    btn:   { top: '#6b95d8', side: '#46699f', depth: 4, r: 12, j: 1, step: 14, pad: 14, deco: 'wolke', bump: 5 },
    btn2:  { top: '#e3ecf8', side: '#b3c3dd', depth: 4, r: 12, j: 1, step: 14, pad: 14, deco: 'wolke', bump: 5 },
    bar:   { top: '#ffffff', side: '#c3d0e6', depth: 9, r: 26, j: 3, step: 30, pad: 30, deco: 'wolke' },
  },
};
// Nacht (Nutzer 25.10.2026, Variante C „nur der Rand“): Hecke bzw. Wolkenbuckel werden nachtdunkel, die Fläche innen bleibt hell
// (lesbar wie am Tag). Stufen 0–3 statt stufenlos: neu gemalt wird nur, wenn die Dämmerung eine Stufe weiter ist
const uiNightStep = () => {
  if (typeof nightAt !== 'function' || typeof NIGHT_MAX === 'undefined' || (typeof GFX === 'object' && GFX.day === 'tag')) return 0;
  return Math.round(Math.max(0, Math.min(1, nightAt() / NIGHT_MAX)) * 3);
};
let uiNightNow = 0;
// fester Zufall je Platte (sieht bei jedem Neumalen gleich aus)
const slabRnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
// Umriss eines abgerundeten Rechtecks, alle `step` px ein Punkt, leicht verschoben – von Hand geschnitten statt border-radius
function slabOutline(w, h, r, j, R, step = 18) {
  const pts = [], seg = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let i = 0; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + (R() - .5) * j, y0 + (y1 - y0) * t + (R() - .5) * j * 1.4]); }
  };
  const arc = (cx, cy, a0) => { for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 8, rr = r + (R() - .5) * j; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } };
  seg(r, 0, w - r, 0); arc(w - r, r, -Math.PI / 2); seg(w, r, w, h - r); arc(w - r, h - r, 0);
  seg(w - r, h, r, h); arc(r, h - r, Math.PI / 2); seg(0, h - r, 0, r); arc(r, r, Math.PI);
  return pts;
}
// Punkte in gleichem Abstand auf dem Rand eines abgerundeten Rechtecks (w×h, Ecken r) – Abstand so angepasst, dass es rundum aufgeht
function roundRectRing(w, h, r, step, even = false) {             // even: gerade Anzahl (Wechsel groß/klein geht rundum auf)
  const sx = w - 2 * r, sy = h - 2 * r, arc = Math.PI / 2 * r, L = 2 * sx + 2 * sy + 4 * arc, n0 = Math.max(8, Math.round(L / step)), n = even ? n0 + (n0 % 2) : n0, out = [];
  const segs = [                                                           // im Uhrzeigersinn ab oben links (nach der Ecke)
    [sx, t => [r + t, 0]], [arc, t => { const a = -Math.PI / 2 + t / r; return [w - r + Math.cos(a) * r, r + Math.sin(a) * r]; }],
    [sy, t => [w, r + t]], [arc, t => { const a = t / r; return [w - r + Math.cos(a) * r, h - r + Math.sin(a) * r]; }],
    [sx, t => [w - r - t, h]], [arc, t => { const a = Math.PI / 2 + t / r; return [r + Math.cos(a) * r, h - r + Math.sin(a) * r]; }],
    [sy, t => [0, h - r - t]], [arc, t => { const a = Math.PI + t / r; return [r + Math.cos(a) * r, r + Math.sin(a) * r]; }],
  ];
  for (let i = 0; i < n; i++) {
    let d = i * L / n;
    for (let k = 0; k < segs.length; k++) { const [len, at] = segs[k]; if (d < len || k === segs.length - 1) { out.push(at(Math.min(d, len))); break; } d -= len; }
  }
  return out;
}
// weich durch die Punkte (Mittelpunkte als Stützstellen)
function slabPath(x, pts, dx, dy) {
  x.beginPath();
  const m = (a, b) => [(a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy], n = pts.length;
  const p = m(pts[n - 1], pts[0]); x.moveTo(p[0], p[1]);
  for (let i = 0; i < n; i++) { const c = pts[i], e = m(c, pts[(i + 1) % n]); x.quadraticCurveTo(c[0] + dx, c[1] + dy, e[0], e[1]); }
  x.closePath();
}
const slabDot = (x, cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2); x.fill(); };
// malt eine Platte w×h (CSS-Pixel) in eine neue Leinwand; Rückgabe { canvas, pad, depth }
function paintSlab(w, h, role, seed, look = uiLookId, night = 0) {
  const L = { pad: 12, ...SLAB_STYLE[look][role] }, R = slabRnd(seed), pad = L.pad;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const c = document.createElement('canvas');
  c.width = Math.ceil((w + 2 * pad) * dpr); c.height = Math.ceil((h + 2 * pad + L.depth) * dpr);
  const x = c.getContext('2d');
  if (!x) return { canvas: c, pad, depth: L.depth };
  x.scale(dpr, dpr); x.translate(pad, pad);
  const pts = slabOutline(w, h, Math.min(L.r, h / 2.2), L.j, R, L.step);
  if (L.deco === 'wolke') {                                // Wolke: Unterseite bläulich
    // geordnet wie die Hecke (Nutzer 25.10.2026): runde Ecken, gleicher Abstand, Buckel fast gleich groß; Knöpfe als glatte
    // Wölkchen mit drei Buckeln oben (nur gemalte Knopf-Platten – die Knöpfe im Spiel sind CSS und bleiben glatt: „blaue Pickel“)
    const rr = Math.min(L.r, h / 2.2);
    let B;
    if (L.bump) {                                          // Knopf: glatt, oben drei Buckel
      B = [[w * 0.3, h * 0.2, h * 0.36], [w * 0.55, h * 0.12, h * 0.48], [w * 0.78, h * 0.24, h * 0.32]];
    } else {
      const big = role === 'bar' ? 15 : 14, small = role === 'bar' ? 13 : 12;      // nur leicht verschieden (Nutzer: „etwas gleichmäßiger“)
      B = roundRectRing(w, h, rr, role === 'bar' ? 24 : 22, true).map(([px, py], i) => [px, py, i % 2 ? small : big]);
    }
    const body = (dy, col) => { for (const [px, py, r] of B) slabDot(x, px, py + dy, r, col); x.beginPath(); x.roundRect(0, dy, w, h, rr); x.fillStyle = col; x.fill(); };
    x.save(); x.filter = 'blur(6px)'; body(L.depth + 5, 'rgba(50,70,110,.18)'); x.restore();
    body(L.depth, L.side);
    body(0, L.top);
    if (L.top !== '#ffffff') for (const [px, py, r] of B) if (py < h / 2) slabDot(x, px - r * .25, py - r * .3, r * .45, 'rgba(255,255,255,.3)');
  } else if (L.deco === 'hecke') {                         // Hecke rundum wie die Gärten im Spiel, innen Papier bzw. Beet
    // gleichmäßig (Nutzer: „so ungleichmäßig, unschön – auch die Ecken gehen gar nicht“): exaktes abgerundetes Rechteck, Büsche in
    // festem Abstand entlang des Rands (auch durch die Ecken, die echte Viertelkreise sind), alle gleich groß
    const rr = Math.min(L.r, h / 2.2), BR = 10.5;
    const rect = (path, ox, oy, ww, hh, r) => { path.beginPath(); path.roundRect(ox, oy, ww, hh, r); };
    x.save(); x.filter = 'blur(6px)'; rect(x, 0, L.depth + 6, w, h, rr); x.fillStyle = 'rgba(40,30,20,.2)'; x.fill(); x.restore();
    const B = roundRectRing(w, h, rr, 17);
    // dichte Hecke darunter: zwischen den Büschen und dem Papier (v. a. an den Ecken) darf nichts durchscheinen (Nutzer 26.10.2026: „kleine Lücke“)
    rect(x, 0, 0, w, h, rr); x.fillStyle = '#3f7430'; x.fill();
    for (const [px, py] of B) slabDot(x, px, py + 5, BR, '#3f7430');
    for (const [px, py] of B) slabDot(x, px, py, BR, '#5c9c43');
    for (const [px, py] of B) slabDot(x, px - 2, py - 3, BR * .55, '#79b85a');
    const ins = 11, ir = Math.max(4, rr - ins * 0.6);
    rect(x, ins, ins, w - 2 * ins, h - 2 * ins, ir); x.fillStyle = L.top; x.fill();
    if (L.beet) {                                          // Erdkrümel im Beet
      x.save(); rect(x, ins, ins, w - 2 * ins, h - 2 * ins, ir); x.clip();
      for (let i = 0; i < w / 8; i++) slabDot(x, R() * w, R() * h, 1 + R() * 1.4, 'rgba(60,40,20,.18)');
      x.restore();
    }
  } else {                                                 // schlichte Platte mit Dicke unten (Knöpfe)
    x.save(); x.filter = 'blur(4px)'; slabPath(x, pts, 0, L.depth + 3); x.fillStyle = 'rgba(40,30,20,.2)'; x.fill(); x.restore();
    slabPath(x, pts, 0, L.depth); x.fillStyle = L.side; x.fill();
    slabPath(x, pts, 0, 0); x.fillStyle = L.top; x.fill();
  }
  if (night > 0 && (L.deco === 'hecke' || L.deco === 'wolke')) {      // Rand dunkler, innen fast unverändert
    const ins = L.deco === 'hecke' ? 11 : 4, rr = Math.min(L.r, h / 2.2), ir = L.deco === 'hecke' ? Math.max(4, rr - 6.6) : rr, k = night / 3;
    x.save(); x.globalCompositeOperation = 'source-atop';
    x.beginPath(); x.rect(-pad, -pad, w + 2 * pad, h + 2 * pad + L.depth + 8); x.roundRect(ins, ins, w - 2 * ins, h - 2 * ins, ir);
    x.fillStyle = `rgba(22,32,78,${(0.48 * k).toFixed(3)})`; x.fill('evenodd');
    x.beginPath(); x.roundRect(ins, ins, w - 2 * ins, h - 2 * ins, ir); x.fillStyle = `rgba(60,45,30,${(0.07 * k).toFixed(3)})`; x.fill();
    x.restore();
  }
  return { canvas: c, pad, depth: L.depth };
}
const SLABS = new Set();                                   // Elemente mit Platte
// gemalt wird im nächsten Bild, nicht im Rückruf selbst – sonst meldet der Browser „ResizeObserver loop …“ als Fehler
const slabDirty = new Set();
const slabObs = typeof ResizeObserver === 'function' ? new ResizeObserver(es => {
  const first = !slabDirty.size;
  for (const e of es) slabDirty.add(e.target);
  if (first) requestAnimationFrame(() => { const l = [...slabDirty]; slabDirty.clear(); for (const el of l) drawSlab(el); });
}) : null;
function drawSlab(el) {
  const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight), key = `${uiLookId}|${w}x${h}|${uiNightNow}`;
  if (!w || !h) return;
  if (el.dataset.slabKey === key) return;
  el.dataset.slabKey = key;
  const inset = el.dataset.slabIn === '1', L = SLAB_STYLE[uiLookId][el.dataset.slab], p0 = L.pad ?? 12;
  // slab-in: ganz im Element (als Hintergrund) – für Fenster, die selbst scrollen (::before würde mitgeschnitten bzw. mitscrollen)
  const { canvas, pad, depth } = inset ? paintSlab(Math.max(20, w - 2 * p0), Math.max(20, h - 2 * p0 - L.depth), el.dataset.slab, +el.dataset.slabSeed || 1, uiLookId, uiNightNow)
    : paintSlab(w, h, el.dataset.slab, +el.dataset.slabSeed || 1, uiLookId, uiNightNow);
  let url = '';
  try { url = canvas.toDataURL(); } catch (e) { return; }
  if (inset) { el.style.backgroundImage = `url(${url})`; return; }
  el.style.setProperty('--slab', `url(${url})`);
  el.style.setProperty('--slab-pad', pad + 'px');
  el.style.setProperty('--slab-depth', depth + 'px');
}
let slabSeedNext = 3;
function lookSlab(el, role, inset = false) {
  if (!el) return;
  el.dataset.slab = role;
  if (inset) el.dataset.slabIn = '1';                                     // als Merker im Datensatz: Fenster setzen ihre Klassen neu (openModal)
  el.classList.add(inset ? 'slab-in' : 'slab');
  if (!el.dataset.slabSeed) el.dataset.slabSeed = String(slabSeedNext += 7);
  if (!SLABS.has(el)) { SLABS.add(el); if (slabObs) slabObs.observe(el); }
  drawSlab(el);
}

// ---------- Knöpfe als Wölkchen (Wolken; Nutzer 25.10.2026 „W1“, Hecke = Holzbrett in style.css) ----------
// Ein kleines Bild je Knopfart: Buckel ringsum, gleichmäßig, Licht von oben, Unterseite dunkler. style.css legt es per border-image
// (9 Teile, Ränder „round“) um jeden Knopf – reines CSS, übersteht also das Neuzeichnen des Infofensters (patch nimmt fremde Klassen
// weg). Maße: Buckel r, Abstand P, Ecke C (= r + P/2, damit die Kanten zwischen zwei Buckeln enden und nahtlos wiederholt werden)
const CLOUD_KNOB = {
  p:   ['#6b95d8', '#46699f', '#9dbbea'],                      // Hauptknopf, „Los!“ (Grundfarbe auch in style.css: --kc)
  on:  ['#5a86cf', '#3c5f97', '#8fb0e4'],                      // gewählte Wahl
  s:   ['#e3ecf8', '#b3c3dd', '#ffffff'],                      // Neben-Knöpfe, Wahl-Chips
  x:   ['#d9655a', '#a8443a', '#ec8c82'],                      // Abreißen & Co.
  off: ['#e6ebf2', '#c8d0dc', '#f4f6fa'],                      // gesperrt
  w:   ['#ffffff', '#c7d4e8', '#ffffff'],                      // Platten der Leiste oben (Ort, Werte)
};
// ganze Pixel (Ecke 16, unten 19; style.css: border-image 32 32 38 32 / 16px …) – halbe Pixel gaben feine Nähte zwischen den 9 Teilen
const CLOUD_KNOB_R = 9, CLOUD_KNOB_P = 14, CLOUD_KNOB_DEPTH = 3;
function cloudKnobImage(top, under, hi) {
  const r = CLOUD_KNOB_R, P = CLOUD_KNOB_P, C = r + P / 2, W = 2 * C + P, H = W + CLOUD_KNOB_DEPTH, k = 2;
  const pts = [];
  for (const a of [r, r + P, W - r]) pts.push([a, r], [a, W - r], [r, a], [W - r, a]);
  const sil = (x, dy, col) => {
    x.fillStyle = col;
    for (const [cx, cy] of pts) { x.beginPath(); x.arc(cx, cy + dy, r, 0, Math.PI * 2); x.fill(); }
    x.fillRect(r, r + dy, W - 2 * r, W - 2 * r);
  };
  const mk = () => { const c = document.createElement('canvas'); c.width = W * k; c.height = H * k; const x = c.getContext('2d'); if (x) x.scale(k, k); return [c, x]; };
  const [c, x] = mk(), [l, y] = mk();
  if (!x || !y) return '';
  sil(x, CLOUD_KNOB_DEPTH, under);
  sil(y, 0, hi); y.globalCompositeOperation = 'source-atop'; sil(y, 1.6, top);    // heller Rand oben, folgt den Buckeln
  y.globalCompositeOperation = 'source-over';                         // zurück (die Test-Leinwand teilt sich ihren Zustand)
  x.drawImage(l, 0, 0, W, H);
  try { return c.toDataURL(); } catch (e) { return ''; }
}
// Runde Knöpfe oben rechts (Lager, Du, Online, Menü) bei Wolken: Kreis mit zwölf kleinen Buckeln (Nutzer 26.10.2026: „die Kreise passen
// nicht zu den Wolken“, Entwurf E in tools/wolkenknopf-entwurf.js) – weiße Oberseite mit Verlauf, blaue Unterseite, Glanz oben links
function cloudDiscImage() {
  const S = 3, N = 64, n = 12, R = 22, r = 6.2, pts = [[32, 31, R - r * 0.35]];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / n * Math.PI * 2; pts.push([32 + Math.cos(a) * R, 31 + Math.sin(a) * R, r]); }
  const c = document.createElement('canvas'); c.width = c.height = N * S; const x = c.getContext('2d');
  if (!x) return '';
  x.scale(S, S);
  const blob = (dy, fill) => { x.fillStyle = fill; for (const [cx, cy, rr] of pts) { x.beginPath(); x.arc(cx, cy + dy, rr, 0, Math.PI * 2); x.fill(); } };
  blob(4, '#93abd6'); blob(0, '#ffffff');
  const g = x.createLinearGradient(0, 6, 0, 58); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, '#dfe9f8'); blob(0, g);
  x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(22, 17, 7, 3, -0.5, 0, Math.PI * 2); x.fill();
  try { return c.toDataURL(); } catch (e) { return ''; }
}
let cloudKnobsDone = false;
function cloudKnobs() {
  if (cloudKnobsDone || !document.body) return;
  for (const [id, [top, under, hi]] of Object.entries(CLOUD_KNOB)) {
    const url = cloudKnobImage(top, under, hi);
    if (!url) return;                                         // ohne Leinwand bleiben die glatten Knöpfe
    document.body.style.setProperty('--cloud-' + id, `url(${url})`);
  }
  const disc = cloudDiscImage();
  if (disc) document.body.style.setProperty('--cloud-disc', `url(${disc})`);
  cloudKnobsDone = true;
}

// ---------- Symbole ----------
// eigene Zeichnungen (64×64, Boden bei y≈56) mit den Grundformen des Spiels: gleiches Licht, gleiche Farben wie die Häuser
const UI_DRAW = {
  taler() {
    const gold = '#f1bf45';
    uiShadow(32, 56, 19);
    const coin = (x, y) => { cyl(x, y, 15, 7.5, 4.2, gold); ellipse(x, y - 4.2, 10.5, 5.2, shade(gold, 0.2)); ellipse(x, y - 4.2, 8, 4, shade(gold, 0.04)); };
    coin(29, 55); coin(33, 50.2); coin(30, 45.4); coin(32.5, 40.6);
  },
  kiste() { uiShadow(32, 55, 20); uiCrate(32, 47, 17, 8.5, 17); },
  wegweiser() {
    uiShadow(32, 58, 12);
    cyl(32, 58, 3, 1.5, 46, '#8a5e38');
    const board = (y, dir, col) => {
      const x0 = 32, x1 = 32 + dir * 22, t = dir * 5;
      poly([[x0 - dir * 3, y], [x1, y + t * .5], [x1 + dir * 6, y + t * .5 + 5], [x1, y + t * .5 + 10], [x0 - dir * 3, y + 10]], col);
      poly([[x0 - dir * 3, y + 10], [x1, y + t * .5 + 10], [x1, y + t * .5 + 12], [x0 - dir * 3, y + 12]], shade(col, -0.3));
    };
    board(12, 1, '#d9a464'); board(28, -1, '#c98f52');
  },
  menue() {                                                // Menü-Knopf (Nutzer 26.10.2026: „das Schilderzeichen lässt nicht erkennen, dass
    g.strokeStyle = menueInk(); g.lineWidth = 6.5; g.lineCap = 'round';   // man dort ins Menü kommt“ → drei Striche, Farbe der Schrift)
    for (const y of [18, 32, 46]) { g.beginPath(); g.moveTo(15, y); g.lineTo(49, y); g.stroke(); }
  },
  lupe() {                                                 // Ansehen
    uiShadow(34, 57, 16);
    uiLine([[39, 39], [50, 52]], '#7a4f2e', 7); uiLine([[39.5, 38.5], [50, 50.5]], '#a5734a', 2.4);
    ellipse(30, 30, 14, 14, '#7f8b96'); ellipse(30, 30, 11, 11, '#cfeef6');
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(25.5, 25.5, 4.2, 2.4, -0.8, 0, Math.PI * 2); g.fill();
  },
  haken() {                                                // Auswählen / Tragen: Kiste am Kranhaken
    uiShadow(32, 58, 13);
    uiLine([[32, 4], [32, 22]], '#6b4f3a', 1.8);
    uiLine([[32, 22], [23, 30]], '#6b4f3a', 1.4); uiLine([[32, 22], [41, 30]], '#6b4f3a', 1.4);
    g.strokeStyle = '#8a8f99'; g.lineWidth = 2.4; g.beginPath(); g.arc(32, 8, 3.4, Math.PI * .1, Math.PI * 1.9); g.stroke();
    uiCrate(32, 43, 14, 7, 14);
  },
  undo() {                                                 // Zurück: gebogener Holzpfeil
    uiShadow(32, 56, 16);
    g.lineCap = 'round'; g.strokeStyle = '#7a4f2e'; g.lineWidth = 8;
    g.beginPath(); g.arc(33, 34, 12, Math.PI * .95, Math.PI * 2.25); g.stroke();
    g.strokeStyle = '#b37b4c'; g.lineWidth = 3; g.beginPath(); g.arc(33, 33, 12, Math.PI * 1.05, Math.PI * 1.9); g.stroke();
    poly([[13, 30], [29, 30], [21, 42]], '#7a4f2e'); poly([[16, 31], [26, 31], [21, 38]], '#9a6a40');
  },
  riegel() {                                               // gesperrt: Vorhängeschloss
    uiShadow(32, 57, 13);
    g.strokeStyle = '#8a8f99'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(22, 34); g.lineTo(22, 24); g.arc(32, 24, 10, Math.PI, 0); g.lineTo(42, 34); g.stroke();
    g.strokeStyle = '#b5bac3'; g.lineWidth = 1.6; g.beginPath(); g.arc(32, 24, 10, Math.PI * 1.1, Math.PI * 1.5); g.stroke();
    poly([[17, 33], [47, 33], [47, 54], [17, 54]], '#d9a43a'); poly([[17, 52], [47, 52], [47, 56], [17, 56]], '#a77a22');
    poly([[17, 33], [47, 33], [47, 36], [17, 36]], '#ecc061');
    ellipse(32, 42, 3.2, 3.2, '#6b4a16'); poly([[30.6, 43], [33.4, 43], [34, 49], [30, 49]], '#6b4a16');
  },
  stern() {                                                // Favoriten: dicker goldener Stern mit Kante
    uiShadow(32, 57, 15);
    const pts = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return [cx + Math.cos(a) * q, cy + Math.sin(a) * q * .92]; });
    poly(pts(32, 34, 21, 9.5), '#c98f1e');
    poly(pts(32, 31, 21, 9.5), '#f2bd3a');
    poly(pts(30.5, 29.5, 9, 4.2), '#f8d978');
  },
};
const menueInk = () => uiLookId === 'wolke' ? '#3b4763' : '#5a3d24';   // wie der Pfeil am Ziel-Fenster (style.css --chev-up)
// Symbole, deren Farbe am Aussehen hängt, beim Wechsel neu malen (Knöpfe und Bildchen in Texten)
function uiIconsRelook() {
  for (const n of ['menue']) {
    if (!UI_ICON_CACHE.has(n)) continue;
    UI_ICON_CACHE.delete(n); UI_ICON_CNV.delete(n);
    const u = uiIcon(n);
    for (const el of document.querySelectorAll(`i.wi[data-ic="${n}"]`)) { el.style.backgroundImage = u ? `url(${u})` : ''; el.dataset.icDone = n; }
    if (WT_SET.has(n) && u) document.documentElement.style.setProperty(wtVar(n), `url(${u})`);
  }
}
const uiShadow = (cx, cy, rx) => ellipse(cx, cy, rx, rx / 2.4, 'rgba(40,50,70,0.18)');
function uiBox(cx, cy, a, b, h, col) {                     // Kiste: (cx, cy) = Mitte der Grundfläche
  poly([[cx - a, cy], [cx, cy + b], [cx, cy + b - h], [cx - a, cy - h]], col);
  poly([[cx, cy + b], [cx + a, cy], [cx + a, cy - h], [cx, cy + b - h]], shade(col, LIGHT.side));
  diamond(cx, cy - h, a, b, shade(col, 0.12));
}
function uiLine(pts, col, w) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.stroke();
}
function uiCrate(cx, cy, a, b, h) {
  const wd = '#c99a5e', dk = shade(wd, -0.28);
  uiBox(cx, cy, a, b, h, wd);
  uiLine([[cx - a, cy - h / 2], [cx, cy + b - h / 2]], dk, 1.2); uiLine([[cx, cy + b - h / 2], [cx + a, cy - h / 2]], shade(dk, -0.1), 1.2);
  uiLine([[cx - a * .5, cy + b * .5 - h + 1], [cx - a * .5, cy + b * .5 - 1]], dk, 1); uiLine([[cx + a * .5, cy + b * .5 - h + 1], [cx + a * .5, cy + b * .5 - 1]], shade(dk, -0.1), 1);
  uiLine([[cx - a + 3, cy - h], [cx, cy - h - b + 1.5], [cx + a - 3, cy - h]], shade(wd, -0.12), 1);
}
// leeren Rand abschneiden, damit alle Symbole gleich groß wirken
function uiTrim(src, pad = 2) {
  const x = src.getContext('2d');
  if (!x) return src;
  const W = src.width, H = src.height, img = x.getImageData(0, 0, W, H), d = img && img.data;
  if (!d) return src;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) if (d[(y * W + i) * 4 + 3] > 12) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return src;
  const c = document.createElement('canvas'); c.width = x1 - x0 + 1 + 2 * pad; c.height = y1 - y0 + 1 + 2 * pad;
  const cx = c.getContext('2d');
  if (cx) cx.drawImage(src, x0, y0, c.width - 2 * pad, c.height - 2 * pad, pad, pad, c.width - 2 * pad, c.height - 2 * pad);
  return c;
}
// Symbol als Bild-Adresse: eigene Zeichnung (UI_DRAW) oder ein Ding des Spiels ohne Bodenkachel ('haus:2' = Haus Stufe 2)
const UI_ICON_CACHE = new Map(), UI_ICON_CNV = new Map();              // Bild-Adresse bzw. fertige Leinwand je Symbol
function uiIcon(name) {
  if (UI_ICON_CACHE.has(name)) return UI_ICON_CACHE.get(name);
  if (name.startsWith('tier:') && typeof figPreview !== 'function') return '';   // friends.js noch nicht geladen: später nochmal (nicht leer merken)
  const S = 3;
  let c = document.createElement('canvas'), url = '';
  const x = c.getContext('2d');
  if (x) {
    const prev = g, fog = FOG;
    try {
      if (name.startsWith('tier:') && typeof figPreview === 'function') {   // Bewohner-Tier wie auf der Insel (Standard-Fell und -Hemd)
        c.width = 64 * S; c.height = 80 * S;
        figPreview(c, figFrom(+name.slice(5), {}, ''), 2.6 * S);
      } else if (name.startsWith('natur:') && typeof drawCritter === 'function') {   // Naturtier (Album) wie auf der Insel, sitzend
        c.width = c.height = 64 * S; x.scale(S, S); g = x; FOG = false;
        const ots = toScreen; toScreen = () => ({ x: 32, y: 50 });
        try { drawCritter({ id: name.slice(6), px: 0, py: 0, h: 0, t0: -1000, until: 1e9, seed: 1, col: '#f2a0c8', flying: false }, 4, 0); }
        finally { toScreen = ots; g.globalAlpha = 1; }
      } else if (UI_DRAW[name]) {
        c.width = c.height = 64 * S; x.scale(S, S); g = x; FOG = false;
        UI_DRAW[name]();
      } else {
        const [type, lvl] = name.split(':');
        c.width = 280 * S; c.height = 260 * S; x.scale(S, S); g = x; FOG = false;
        drawObject(type, 140, 200, isBig(type) ? 0.8 : 1.3, 0, 3, 7, +lvl || 1, null);
      }
    } catch (e) { /* Symbol fehlt lieber, als dass die Leiste ausfällt */ } finally { g = prev; FOG = fog; }
    try { const tc = uiTrim(c); UI_ICON_CNV.set(name, tc); url = tc.toDataURL(); } catch (e) { url = ''; }
  }
  UI_ICON_CACHE.set(name, url);
  return url;
}
// dasselbe Symbol als fertige Leinwand (zum Zeichnen auf der Karte: Symbole über Häusern, Schilder); null = kein Bild für dieses Emoji.
// Leinwand statt Bild: sofort da (ein Bild aus einer Adresse lädt erst später – dann würde das Häuser-Symbol jedes Bild neu gemalt)
function uiIconCanvas(emoji) {
  const name = typeof emoji === 'string' && wiTextName(emoji);
  if (!name) return null;
  if (!UI_ICON_CACHE.has(name)) uiIcon(name);
  const c = UI_ICON_CNV.get(name);
  return c && c.width && c.height ? c : null;
}
// Bild eines echten Feldes (Infofenster): mit seinen Farben/Formen, ohne Bodenkachel; je Aussehen des Feldes einmal gemalt
const HERO_SKIP = new Set(['weg', 'schiene', 'tunnel', 'pb_gleis', 'fzboden', 'graben', 'schuett', 'anhoehe', 'huegeltreppe', 'huegelrampe', 'bruecke', 'dach', 'stuetze', 'dachtreppe']);
const UI_HERO_CACHE = new Map();
function uiHero(t) {
  if (!t || !ITEMS[t.b] || HERO_SKIP.has(t.b) || (typeof isTrack === 'function' && isTrack(t.b))) return '';
  let key = '';
  try { key = JSON.stringify(t); } catch (e) { return ''; }
  if (UI_HERO_CACHE.has(key)) return UI_HERO_CACHE.get(key);
  const S = 3, big = isBig(t.b), W = big ? 420 : 280, H = big ? 380 : 260;
  const c = document.createElement('canvas'), x = c.getContext('2d');
  let url = '';
  if (x) {
    c.width = W * S; c.height = H * S; x.scale(S, S);
    const prev = g, fog = FOG; g = x; FOG = false;
    try { drawObject(t.b, W / 2, H - 60, big ? 0.8 : 1.3, 0, 3, 7, t.lvl || 1, t); } catch (e) { /* lieber kein Bild */ } finally { g = prev; FOG = fog; }
    try { url = uiTrim(c).toDataURL(); } catch (e) { url = ''; }
  }
  if (UI_HERO_CACHE.size > 120) UI_HERO_CACHE.clear();
  UI_HERO_CACHE.set(key, url);
  return url;
}

// alle <i class="wi" data-ic="…"> mit ihrem Bild füllen
function fillUiIcons(root = document) {
  for (const el of root.querySelectorAll('i.wi[data-ic]')) {
    if (el.dataset.icDone === el.dataset.ic) continue;
    const url = uiIcon(el.dataset.ic);
    if (url) { el.style.backgroundImage = `url(${url})`; el.dataset.icDone = el.dataset.ic; }
  }
}

// Symbol als Element (für Knöpfe); fehlt das Bild, bleibt `fallback` (Text) stehen
function wiEl(name, fallback = '') {
  const i = document.createElement('i');
  i.className = 'wi'; i.dataset.ic = name; i.setAttribute('aria-hidden', 'true');
  const url = uiIcon(name);
  if (url) { i.style.backgroundImage = `url(${url})`; i.dataset.icDone = name; } else { i.className = 'ic'; i.textContent = fallback; }
  return i;
}
// Knopf der Bauleiste: Symbol und darunter ein Wort (.tx – schmal ausgeblendet, style.css)
function wiFace(b, name, label) {
  const t = document.createElement('span'); t.className = 'tx'; t.textContent = label;
  b.replaceChildren(wiEl(name), t);
}
// Bereiche der Bauleiste und Gruppen im Feld: Bild aus dem Spiel statt Emoji (unbekannt: Emoji bleibt)
const MENU_ICON = { stadt: 'haus:3', herstellen: 'baecker', freizeit: 'fz_karussell', gestalten: 'giesskanne',
  wohnen: 'haus:2', bahn: 'station', untergrund: 'ubahn', wasser: 'bootssteg', einrichtungen: 'schule', taler: 'muehle', rohstoffe: 'holz',
  strom: 'windrad', veredeln: 'schmiede', fzpark: 'fz_ballon', fzfahrt: 'fz_teetassen', fzbahn: 'fz_station', parkbahn: 'pb_station',
  fzschloss: 'fz_schloss', wunder: 'riesenrad', hoehen: 'anhoehe', gruen: 'baum', platz: 'laterne', besonderes: 'statue',
  fav: 'stern', recent: 'rathaus' };
function menuIcon(el, id) {
  const ic = el.querySelector('.ic'), name = MENU_ICON[id] || (ic && wiTextName(ic.textContent.trim()));   // sonst über das Emoji (WI_TEXT)
  if (!ic || !name || !uiIcon(name)) return;
  ic.replaceWith(wiEl(name));
}

// Emojis in Texten → Spiel-Symbole (nur die eindeutigen). Das Zeichen bleibt im Text (Vorlesen, Suchen, Tests), sichtbar ist das Bild
// (.wt, style.css; Bild über --wt-…, einmal am Dokument gesetzt – so bleibt der Text bei jedem Neuzeichnen gleich und patch() ruhig)
// Schlüssel ohne Variantenzeichen (U+FE0F) – das Muster nimmt es mit, wenn es dabeisteht (⛏️, ❤️, ⚙️ …)
const WI_TEXT = {
  '🪙': 'taler', '📦': 'kiste', '👥': 'haus:2', '💡': 'bibliothek', '🔒': 'riegel', '🌸': 'blumen',
  // Rohstoffe (RES)
  '🪵': 'holz', '🪨': 'stein', '⛏': 'erz', '🍎': 'obst', '🪚': 'bretter', '🧱': 'quader', '🔩': 'metall', '💎': 'kristall', '☕': 'kaffee', '🍵': 'tee', '🍫': 'kakao',
  // häufige Zeichen (ui-symbole.js oder ein Ding des Spiels)
  '⚡': 'blitz', '✨': 'funkel', '🎉': 'funkel', '🎆': 'funkel', '🎨': 'palette', '🖼': 'palette', '🎁': 'geschenk', '🏮': 'laterne', '🗑': 'tonne',
  '☁': 'wolke', '💭': 'gedanke', '📖': 'buch', '📒': 'buch', '📚': 'bibliothek', '⚙': 'zahnrad', '⛵': 'boot', '🚢': 'boot', '⛴': 'boot', '👑': 'krone',
  '🏝': 'insel', '🧺': 'korb', '🐌': 'schnecke', '📜': 'rolle', '🌙': 'mond', '❤': 'herz', '💛': 'herz', '🚩': 'flagge', '📬': 'briefkasten', '📌': 'pin',
  '🪓': 'axt', '🧭': 'kompass', '🧹': 'besen', '🌊': 'welle', '🪜': 'leiter', '🏗': 'kran', '👷': 'kran', '⭐': 'stern', '✋': 'haken', '👁': 'glaskugel',
  '👆': 'lupe', '🌐': 'freundesbank', '☰': 'menue', '🪧': 'menue', '🛤': 'wegweiser', '⛰': 'stein', '⛱': 'pavillon',
  '🏛': 'rathaus', '🚆': 'station', '🚉': 'station', '🏠': 'haus:1', '🏘': 'reihenhaus', '🌉': 'seebruecke', '🌳': 'baum', '🌲': 'baum', '🎡': 'riesenrad',
  '❓': 'frage', '❔': 'frage', '🐾': 'tier:2', '👀': 'lupe', '⛩': 'bogen', '🌫': 'wolke', '🚧': 'kran', '📩': 'briefkasten',
  '🌅': 'sonne', '🧰': 'kiste', '⛺': 'pavillon',
  '🐱': 'tier:0', '🐻': 'tier:1', '🐰': 'tier:2', '🐿': 'tier:3', '🦔': 'tier:4', '🦊': 'tier:5', '🦒': 'tier:6', '🐘': 'tier:7', '🦆': 'tier:8',
  '🏰': 'fz_schloss', '🎢': 'fz_looping', '🌿': 'busch', '🕘': 'uhrturm', '🏭': 'fabrik', '🚇': 'ubahn', '🗼': 'leuchtturm', '💾': 'truhe',
  '🛍': 'blumenladen', '🛒': 'korb', '🌬': 'windrad', '🪑': 'bank', '📍': 'pin', '🖌': 'palette', '🚂': 'station', '🚋': 'station', '🚃': 'station', '🚈': 'station',
  '🚄': 'station', '🏆': 'pokal_gold', '🚡': 'seilbahn', '🌠': 'funkel', '🌟': 'funkel', '⚓': 'hafen', '♨': 'geothermie', '🌷': 'blumen',
  '🌹': 'blumen', '🌻': 'blumen', '🌼': 'blumen', '💐': 'blumen', '🏡': 'haus:2', '📋': 'rolle', '💰': 'taler', '🌱': 'busch', '🍃': 'busch', '🎠': 'fz_karussell',
  '🔨': 'schmiede', '💧': 'brunnen', '⛲': 'brunnen', '☀': 'sonne', '💌': 'briefkasten', '📮': 'briefkasten', '🔭': 'sternwarte', '💼': 'fabrik', '🔍': 'lupe',
  '🔬': 'bibliothek', '🎓': 'uni', '🏦': 'rathaus', '🔓': 'riegel', '🗺': 'kompass', '🛳': 'boot', '🚤': 'boot', '🛶': 'boot', '🌴': 'palme', '🏖': 'insel',
  '🎈': 'fz_ballon', '🪴': 'blumentopf', '🌾': 'feld', '🎭': 'theater', '🏬': 'kaufhaus', '🏨': 'hotel', '🎪': 'markt',
};
Object.assign(WI_TEXT, {
  '🧨': 'dynamit', '⚠': 'warnung', '😣': 'warnung', '❄': 'schnee', '🔗': 'kette', '📏': 'lineal', '📐': 'lineal', '🎶': 'noten', '🎵': 'noten',
  '🚪': 'tuer', '🌈': 'regenbogen', '🔁': 'kreispfeil', '🔄': 'kreispfeil', '🔀': 'kreispfeil', '🔑': 'schluessel',
  '👋': 'herz', '👏': 'herz', '🤍': 'herz', '🙂': 'sonne', '🌄': 'sonne', '🎮': 'zahnrad', '📱': 'briefkasten', '🎒': 'schule', '📈': 'taler', '🪟': 'glashaus',
  '🎟': 'rolle', '🏷': 'rolle', '🧩': 'kiste', '🧳': 'kiste', '📥': 'kiste', '📤': 'kiste', '📂': 'kiste', '🔔': 'uhrturm', '🏙': 'reihenhaus', '🏯': 'fz_schloss',
  '🎣': 'fischer', '🐚': 'insel', '🍄': 'busch', '🐝': 'blumen', '🍰': 'cafe', '🚶': 'wegweiser', '🧅': 'feld', '🎏': 'flagge', '✂': 'friseur',
  '🎖': 'stern', '✏': 'palette', '🤔': 'gedanke', '🕌': 'rathaus', '🍒': 'obst', '🖐': 'haken', '💺': 'bank', '🚀': 'funkel',
});
// Naturtiere (NATURE, Album): gezeichnet wie draußen (🐦 🐸 🦉 …), wenn das Emoji nicht schon vergeben ist (✨ bleibt Funkeln)
for (const n of typeof NATURE === 'object' && NATURE ? NATURE : []) {
  const e = String(n.icon || '').replace(/\uFE0F/g, '');
  if (e && !WI_TEXT[e]) WI_TEXT[e] = 'natur:' + n.id;
}
// Läden: ihr Emoji (SHOPS, data.js) zeigt das echte Laden-Gebäude (🧋 → Bubble-Tea-Laden …), wenn es nicht schon vergeben ist
for (const [id, sh] of Object.entries(typeof SHOPS === 'object' && SHOPS ? SHOPS : {})) {
  const e = String(sh.icon || '').replace(/\uFE0F/g, '');
  if (e && !WI_TEXT[e]) WI_TEXT[e] = id;
}
const WI_TEXT_RE = new RegExp(`(?:${Object.keys(WI_TEXT).join('|')})\uFE0F?`, 'gu');
const WI_TEXT_HAS = new RegExp(WI_TEXT_RE.source, 'u');                  // zum Prüfen: ohne g, merkt sich keine Position zwischen Aufrufen
const wiTextName = e => WI_TEXT[e.replace(/\uFE0F/g, '')];
const wtVar = name => '--wt-' + name.replace(/[^a-z0-9]/g, '');
const WT_SET = new Set();                                                  // Bild schon am Dokument (erst bei Bedarf gemalt)
function wtEnsure(name) {
  if (WT_SET.has(name) || typeof document === 'undefined') return;
  const u = uiIcon(name);
  if (u) { document.documentElement.style.setProperty(wtVar(name), `url(${u})`); WT_SET.add(name); }
}
// Bildchen, die nur schmücken, sind unsichtbar (Klasse deko; Nutzer 26.10.2026: „da sind noch sauviele Emojis drin … wäge mal ab,
// was alles weg kann“, Vorschlag „passt“). Das Zeichen bleibt im Text (Vorlesen, Suchen, Tests).
//   weg:   in Überschriften, Reitern, Knöpfen und Abschnitts-Schildern mit Text; vor einem Wort („🏮 Laternen“, „Das 📖 Tagebuch“)
//   bleibt: vor einer Zahl (Einheit: „🏮 22 / 22“, „🪙 40“), als Wort selbst („unter 🌐.“), allein im Knopf, in Listen von Dingen
// Bunte Emojis ohne eigenes Bild (💬 🔢 …) verschwinden an denselben Stellen, sonst bleiben sie stehen; ♥ ✓ ✦ sind Schrift.
const WI_RAW = '[\\u{1F000}-\\u{1FAFF}\\u2795]\\uFE0F?';
const WI_ANY_RE = new RegExp(`${WI_TEXT_RE.source}|${WI_RAW}`, 'gu'), WI_ANY_HAS = new RegExp(WI_ANY_RE.source, 'u');
const WI_VOID = /^(br|img|input|hr|wbr|meta|link|source|area|col|embed|param|track)$/;
const WI_HEAD_TAG = /^(h[1-6]|summary|button)$/, WI_HEAD_CLS = /(^|\s)(btn|look|label)(\s|$)/;
const WI_LIST_CLS = /(^|\s)(chip|stat|res|cost|lx-ic|ic|alb|wish-ic)(\s|$)/;
const wiCls = attrs => (/class\s*=\s*"([^"]*)"/.exec(attrs) || [])[1] || '';
const wiKind = c => /[\p{L}„(]/u.test(c) ? 'wort' : /\d/.test(c) ? 'zahl' : 'zeichen';
const WI_STATUS = /^(🔒|🔓|⚠)/u;                                         // Zustand (gesperrt, Warnung) – kein Schmuck
function wiDeko(e, stack, prevText, next, afterDigit) {
  if (next === 'zahl' || afterDigit) return false;                      // Einheit: „🏮 22 / 22“, „25 ✨ am Tag“
  if (WI_STATUS.test(e)) return false;
  if (!prevText && next === 'ende') return false;                        // allein: Bildknopf
  if (next !== 'wort') return false;                                     // ist selbst das Wort: „unter 🌐.“, Abreißen „🗑️ +61.870“
  if (stack.some(f => WI_HEAD_TAG.test(f.name) || WI_HEAD_CLS.test(wiCls(f.attrs)) || /\bdata-tab\b/.test(f.attrs))) return true;
  return !stack.some(f => f.name === 'span' || WI_LIST_CLS.test(wiCls(f.attrs)));   // Listen von Dingen: „🌳 Baum“
}
// outer: umgebende Elemente (wiTextNodes: aus dem Dokument), prev/tail: Text davor bzw. danach im selben Element
function wiText(html, outer = null) {
  if (typeof html !== 'string' || !WI_ANY_HAS.test(html)) return html;
  const parts = html.split(/(<[^>]*>)/), root = { name: '', attrs: '', text: !!(outer && outer.prev) };
  const stack = outer ? outer.stack.map(f => ({ ...f, text: true })) : [];
  const tagOf = t => { const m = /^<\s*(\/)?\s*([a-zA-Z][\w-]*)([^>]*)>$/.exec(t); return m && { close: !!m[1], name: m[2].toLowerCase(), attrs: m[3], open: !m[1] && !WI_VOID.test(m[2].toLowerCase()) && !/\/\s*>$/.test(t) }; };
  const next = (i, rest) => {                                            // was nach dem Bildchen kommt: wort, zahl, zeichen oder ende
    const r = rest.trimStart(); if (r) return wiKind(r[0]);
    let depth = 0;
    for (let j = i + 1; j < parts.length; j++) {
      const p = parts[j];
      if (p.startsWith('<')) { const t = tagOf(p); if (!t) continue; if (t.close) { if (!depth) return 'ende'; depth--; } else if (t.open) depth++; continue; }
      const q = p.trimStart(); if (q) return wiKind(q[0]);
    }
    const tail = outer && outer.tail ? outer.tail.trimStart() : '';
    return tail ? wiKind(tail[0]) : 'ende';
  };
  let lastCh = outer && outer.prev ? outer.prev.slice(-1) : '';         // letztes Zeichen davor (Zahl → Einheit)
  const said = t => { root.text = true; for (const f of stack) f.text = true; const q = t.trimEnd(); if (q) lastCh = q.slice(-1); };
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      out.push(p);
      const t = tagOf(p); if (!t) continue;
      if (t.close) { const k = stack.map(f => f.name).lastIndexOf(t.name); if (k >= 0) stack.length = k; }
      else if (t.open) stack.push({ name: t.name, attrs: t.attrs, text: false });
      continue;
    }
    const top = stack[stack.length - 1] || root;
    if (top.name === 'i' && /(^|\s)wt(\s|$)/.test(wiCls(top.attrs))) { out.push(p); continue; }   // schon umgewandelt (wiText zweimal)
    let res = '', last = 0;
    for (const m of p.matchAll(WI_ANY_RE)) {
      const before = p.slice(last, m.index), e = m[0];
      res += before; if (before.trim()) said(before);
      const nx = next(i, p.slice(m.index + e.length)), unit = nx === 'zahl' || /\d/.test(lastCh), dk = wiDeko(e, stack, top.text, nx, unit);
      const name = unit && e.startsWith('✨') ? 'sternstaub' : wiTextName(e);   // ✨ an einer Zahl ist Sternstaub (Säckchen), sonst Funkeln
      const sp = dk && /\s/.test(p[m.index + e.length] || '') ? p[m.index + e.length] : '';   // unsichtbar samt Leerzeichen: „(🏘️ Stadt“ → „(Stadt“
      if (name) { wtEnsure(name); res += `<i class="wt${dk ? ' deko' : ''}" style="background-image:var(${wtVar(name)})">${e}${sp}</i>`; }
      else res += dk ? `<i class="wt deko">${e}${sp}</i>` : e;
      said(e); last = m.index + e.length + sp.length;
    }
    const rest = p.slice(last);
    res += rest; if (rest.trim()) said(rest);
    out.push(res);
  }
  return out.join('');
}

// Leisten, die ihren Text selbst setzen (Hinweis, Auswahl, Erfolg …): Textknoten nachträglich umwandeln. Nicht für Fenster, die
// patch() alle 0,2 s abgleicht (Infofenster, große Fenster) – die laufen schon über wiText im HTML
function wiTextNodes(root) {
  if (!root || typeof document.createTreeWalker !== 'function') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), hits = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (WI_ANY_HAS.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest('i.wt, canvas, input, textarea'))) hits.push(n);
  }
  for (const n of hits) {
    const stack = [], sib = (from, dir) => { let t = ''; for (let x = from[dir]; x; x = x[dir]) t += x.textContent; return t; };
    for (let a = n.parentElement; a && a !== document.body; a = a.parentElement) stack.unshift({ name: a.tagName.toLowerCase(), attrs: ` class="${a.getAttribute('class') || ''}"${a.hasAttribute('data-tab') ? ' data-tab' : ''}` });
    const t = document.createElement('template');
    t.innerHTML = wiText(escHtml(n.nodeValue), { stack, prev: sib(n, 'previousSibling').trim(), tail: sib(n, 'nextSibling') });
    n.replaceWith(t.content);
  }
}
const WI_WATCH = ['hint', 'sel-bar', 'achv', 'sd-try-bar', 'card-name', 'style-bar', 'toast', 'store'];   // Leiste oben nicht: sie schreibt selbst über setWiText (hudtap.test)
let wiWatch = null;
function watchUiEmojis() {
  if (wiWatch || typeof MutationObserver !== 'function') return;
  wiWatch = new MutationObserver(ms => { const seen = new Set(); for (const m of ms) { const r = m.target.nodeType === 1 ? m.target : m.target.parentElement; if (r && !seen.has(r)) { seen.add(r); wiTextNodes(r); } } });
  for (const id of WI_WATCH) { const el = document.getElementById(id); if (el) { wiTextNodes(el); wiWatch.observe(el, { childList: true, subtree: true, characterData: true }); } }
}

// Knopf „Du“ oben: die eigene Figur (mit Hut, Brille …) statt des Tier-Emojis; neu gemalt, wenn sich das Aussehen ändert
let youFaceSig = null;
function youFaceSync() {
  const el = document.getElementById('you-face');
  if (!el || typeof meFigLook !== 'function' || typeof figPreview !== 'function') return;
  let fig, sig;
  try { fig = meFigLook(); sig = JSON.stringify(fig); } catch (e) { return; }
  if (sig === youFaceSig) return;
  youFaceSig = sig;
  const S = 3, c = document.createElement('canvas'); c.width = 64 * S; c.height = 84 * S;
  let url = '';
  try { figPreview(c, { ...fig, label: null }, 2.6 * S); url = uiTrim(c).toDataURL(); } catch (e) { url = ''; }
  el.classList.toggle('drawn', !!url);
  el.style.backgroundImage = url ? `url(${url})` : '';
}

// von updateHud alle 0,2 s: Dämmerung eine Stufe weiter → alle Platten neu malen
function uiNightSync() {
  const n = uiNightStep();
  if (n === uiNightNow) return;
  uiNightNow = n;
  for (const el of SLABS) if (el.isConnected) drawSlab(el);
}

// Weglegen-Knopf: zeigt, was man in der Hand hat (Nutzer: „das X gefällt mir nicht“); antippen legt es weg. Das ✕ bleibt als
// Text im Knopf (Vorlesen, Tests), sichtbar ist das Bild
function heldPic(b, tool) {
  const x = b.querySelector('.x');
  if (!x || x.dataset.held === tool) return;
  x.dataset.held = tool;
  requestAnimationFrame(() => heldPicPaint(x, tool));                     // im nächsten Bild malen, nicht mitten im Werkzeugwechsel
}
function heldPicPaint(x, tool) {
  if (!x.isConnected || x.dataset.held !== tool) return;
  let url = '';
  if (typeof isDragTool === 'function' && isDragTool(tool) && typeof katPic === 'function') {
    try { url = katPic(tool, 34).toDataURL(); } catch (e) { url = ''; }
  }
  if (!url && ITEMS[tool]) url = uiIcon(tool);
  if (!url) url = uiIcon(tool === 'verschieben' ? 'haken' : 'kiste');
  x.classList.toggle('pic', !!url);
  x.style.backgroundImage = url ? `url(${url})` : '';
}

// ---------- anwenden ----------
// Die Schrift (Mali, Google Fonts) kommt erst nach dem Start: Bilder, die vorher schon mit Text gemalt und aufgehoben wurden
// (Ladenschilder an Gebäuden, Fragezeichen-Symbol, Bilder im Baumenü), einmal neu malen, sobald sie da ist
let uiFontDone = false;
function uiFontReady() {
  if (uiFontDone || typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
  uiFontDone = true;
  document.fonts.load('700 16px Mali').then(faces => {
    if (!faces || !faces.length) return;                                  // ohne Netz: Ersatzschrift, nichts neu zu malen
    if (typeof resetDrawCaches === 'function') resetDrawCaches();
    if (typeof katPicCache !== 'undefined') katPicCache.clear();
    for (const m of [UI_ICON_CACHE, UI_ICON_CNV]) m.delete('frage');
    if (WT_SET.has('frage')) { WT_SET.delete('frage'); wtEnsure('frage'); }   // ❓ in Texten
  }).catch(() => {});
}
function applyUiLook() {
  const b = document.body;
  if (!b) return;
  for (const id of Object.keys(UI_LOOKS)) b.classList.toggle('look-' + id, id === uiLookId);
  uiIconsRelook();
  fillUiIcons();
  watchUiEmojis();
  wtEnsure('stern'); wtEnsure('drehen');                                                      // Favoriten-Sterne im Baumenü und Infofenster (style.css)
  if (uiLookId === 'wolke') cloudKnobs();                                                     // Wölkchen für die Knöpfe (style.css, border-image)
  lookSlab(document.getElementById('modal-card'), 'paper', true);        // große Fenster
  lookSlab(document.getElementById('cats-isle'), 'bar');                 // Bauleiste: Beet in der Hecke bzw. Wolke
  lookSlab(document.getElementById('sheet'), 'paper', true);              // aufklappendes Feld (scrollt selbst: Platte als Hintergrund)
  lookSlab(document.getElementById('panel'), 'paper', true);              // Infofenster (scrollt selbst)
  lookSlab(document.getElementById('goal'), 'paper');                     // Ziel-Fenster
  for (const el of SLABS) { if (!el.isConnected) { SLABS.delete(el); if (slabObs) slabObs.unobserve(el); continue; } drawSlab(el); }
}
