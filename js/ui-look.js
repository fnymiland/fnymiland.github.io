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
let uiLookId = (() => {
  let v = null;
  try { v = localStorage.getItem(UI_LOOK_KEY); } catch (e) { /* privates Fenster */ }
  return UI_LOOKS[v] ? v : 'hecke';
})();
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
function paintSlab(w, h, role, seed, look = uiLookId) {
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
  const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight), key = `${uiLookId}|${w}x${h}`;
  if (!w || !h) return;
  if (el.dataset.slabKey === key) return;
  el.dataset.slabKey = key;
  const inset = el.dataset.slabIn === '1', L = SLAB_STYLE[uiLookId][el.dataset.slab], p0 = L.pad ?? 12;
  // slab-in: ganz im Element (als Hintergrund) – für Fenster, die selbst scrollen (::before würde mitgeschnitten bzw. mitscrollen)
  const { canvas, pad, depth } = inset ? paintSlab(Math.max(20, w - 2 * p0), Math.max(20, h - 2 * p0 - L.depth), el.dataset.slab, +el.dataset.slabSeed || 1)
    : paintSlab(w, h, el.dataset.slab, +el.dataset.slabSeed || 1);
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
const MENU_ICON = { stadt: 'haus:3', herstellen: 'baecker', freizeit: 'fz_karussell', gestalten: 'blumen',
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
  '👆': 'lupe', '🌐': 'freundesbank', '☰': 'wegweiser', '🛤': 'wegweiser', '⛰': 'stein', '⛱': 'pavillon',
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
function wiText(html) {
  if (typeof html !== 'string' || !WI_TEXT_HAS.test(html)) return html;
  return html.split(/(<[^>]*>)/).map(part => part.startsWith('<') ? part
    : part.replace(WI_TEXT_RE, e => { const n = wiTextName(e); wtEnsure(n); return `<i class="wt" style="background-image:var(${wtVar(n)})">${e}</i>`; })).join('');
}

// Leisten, die ihren Text selbst setzen (Hinweis, Auswahl, Erfolg …): Textknoten nachträglich umwandeln. Nicht für Fenster, die
// patch() alle 0,2 s abgleicht (Infofenster, große Fenster) – die laufen schon über wiText im HTML
function wiTextNodes(root) {
  if (!root || typeof document.createTreeWalker !== 'function') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), hits = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (WI_TEXT_HAS.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest('i.wt, canvas, input, textarea'))) hits.push(n);
  }
  for (const n of hits) {
    const t = document.createElement('template');
    t.innerHTML = wiText(escHtml(n.nodeValue));
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

// ---------- anwenden ----------
function applyUiLook() {
  const b = document.body;
  if (!b) return;
  for (const id of Object.keys(UI_LOOKS)) b.classList.toggle('look-' + id, id === uiLookId);
  fillUiIcons();
  watchUiEmojis();
  lookSlab(document.getElementById('modal-card'), 'paper', true);        // große Fenster
  lookSlab(document.getElementById('cats-isle'), 'bar');                 // Bauleiste: Beet in der Hecke bzw. Wolke
  lookSlab(document.getElementById('sheet'), 'paper', true);              // aufklappendes Feld (scrollt selbst: Platte als Hintergrund)
  lookSlab(document.getElementById('panel'), 'paper', true);              // Infofenster (scrollt selbst)
  lookSlab(document.getElementById('goal'), 'paper');                     // Ziel-Fenster
  for (const el of SLABS) { if (!el.isConnected) { SLABS.delete(el); if (slabObs) slabObs.unobserve(el); continue; } drawSlab(el); }
}
