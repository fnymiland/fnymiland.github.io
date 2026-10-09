'use strict';
// ---------------------------------------------------------------------------
// Minimap am PC (Block 135): unten rechts die ganze Welt schräg wie das Spiel (Rauten), das Sichtfeld als Rahmen.
// Antippen oder Ziehen springt hin. Nur mit Maus und breitem Fenster; einklappbar (je Gerät gemerkt).
// Bild: je Feld ein 2×1-Rechteck an seiner Rautenmitte – u = x − y (waagerecht), v = (x + y) / 2 (senkrecht). Gezeigt wird
// nur der Teil mit Land (und eigenem Aufgeschüttetem) plus MINI_PAD Felder Meer – sonst wären die Inseln winzig.
// Neu gemalt nur, wenn sich die Welt ändert (miniSig), höchstens alle MINI_EVERY ms; der Rahmen jedes Bild.
// ---------------------------------------------------------------------------
const MINI_KEY = 'kachelhausen_minimap', MINI_EVERY = 1500, MINI_W = 240, MINI_H = 160, MINI_PAD = 5, MINI_SEA = '#74d0e6';
let mini = null;                       // { box, cv, base, u0, v0, sig, at, view }
let miniOpen = (() => { try { return localStorage.getItem(MINI_KEY) !== 'zu'; } catch (e) { return true; } })();
const miniWanted = () => !PHONE && window.innerWidth >= 900 && !!(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);

// Farbe eines Felds auf der Karte: Gebäude/Wege obenauf, sonst der Boden; fremdes Land blasser (wie FOG im Bild)
const MINI_CAT = { bau: '#c9855a', bildung: '#c9855a', kultur: '#b77fc4', markt: '#e0a04f', strom: '#8f9aa8', wunder: '#f2c14e', fz: '#ef8fb5', deko: '#5fae4a', land: null };
function miniColor(x, y) {
  const k = x + ',' + y, a = state.tiles.has(k) ? k : COVER.get(k), t = a && state.tiles.get(a);
  let c = null;
  if (t) {
    const d = ITEMS[t.b] || {};
    c = t.b === 'weg' || (t.b === 'schiene' && t.cross) ? '#ecdcb8' : t.b === 'haus' ? '#e07a5f'
      : d.cat === 'netz' ? '#8d8f96' : MINI_CAT[d.cat] !== undefined ? MINI_CAT[d.cat] : '#c9855a';
  }
  if (!c) {
    const ter = terrainAt(x, y), look = terraLook(x, y);
    if (ter === 'water') return MINI_SEA;
    c = look === 'park' ? '#80c05c' : look === 'fz' ? '#9ad27a' : look === 'sand' || (ter === 'grass' && look !== 'wiese' && isBeach(x, y)) ? '#f1dfae'
      : ter === 'grass' ? '#96d56f' : ter === 'forest' ? '#6fb352' : ter === 'obst' ? '#86c35b' : ter === 'erz' ? '#b0a287' : ter === 'kristall' ? '#b3c2cc' : '#aabb94';
  }
  return ownedTile(x, y) ? c : mix(c, '#eef2ee', 0.45);
}
const miniSig = () => [groundVersion, state.tiles.size, state.owned.size, state.claimed.size, state.terra.size, WORLD.cMin, WORLD.cMax].join('|');
function miniBounds() { return { lo: WORLD.cMin * CHUNK, hi: (WORLD.cMax + 1) * CHUNK - 1 }; }
function miniPaint() {
  const { lo, hi } = miniBounds(), land = [];
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (let y = lo; y <= hi; y++) for (let x = lo; x <= hi; x++) {
    if (terrainAt(x, y) === 'water' && !state.tiles.has(x + ',' + y) && !COVER.has(x + ',' + y)) continue;   // Meer (Brücken zählen)
    const u = x - y, v = (x + y) / 2;
    if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v;
    land.push(x, y);
  }
  if (!land.length) { u0 = v0 = -10; u1 = v1 = 10; }
  mini.u0 = u0 - 1 - MINI_PAD * 2; mini.v0 = v0 - 0.5 - MINI_PAD;          // Ränder: ein Feld ist 2 breit, 1 hoch
  const c = mini.base || document.createElement('canvas');
  c.width = Math.ceil(u1 + 1 + MINI_PAD * 2 - mini.u0); c.height = Math.ceil(v1 + 0.5 + MINI_PAD - mini.v0);
  mini.base = c;
  const x2 = c.getContext('2d');
  if (!x2) return;
  x2.fillStyle = MINI_SEA; x2.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < land.length; i += 2) {
    const x = land[i], y = land[i + 1];
    x2.fillStyle = miniColor(x, y);
    x2.fillRect(x - y - 1 - mini.u0, (x + y) / 2 - 0.5 - mini.v0, 2, 1);
  }
}
// Spielpunkt (iso, wie cam.x/cam.y) ↔ Bildpunkt der Karte (vor dem Maßstab aufs Kärtchen)
const miniOf = (X, Y) => [X / (TW / 2) - mini.u0, Y / TH - mini.v0];
const miniTo = (ix, iy) => [(ix + mini.u0) * TW / 2, (iy + mini.v0) * TH];
function miniBuild() {
  const box = document.createElement('div');
  box.id = 'minimap';
  box.innerHTML = `<canvas role="button" tabindex="0" aria-label="Übersichtskarte – antippen springt hin"></canvas>
    <button class="mini-x" aria-label="Übersichtskarte einklappen">–</button><button class="mini-open" aria-label="Übersichtskarte zeigen">🗺️</button>`;
  document.body.appendChild(box);
  mini = { box, cv: box.querySelector('canvas'), base: null, u0: 0, v0: 0, sig: '', at: -1e9, view: '' };
  const jump = e => {
    const r = mini.cv.getBoundingClientRect(), s = mini.base.width / r.width;
    const [X, Y] = miniTo((e.clientX - r.left) * s, (e.clientY - r.top) * s);
    cam.x = X; cam.y = Y; clampCam(); lastInput = performance.now();
  };
  let down = false;
  mini.cv.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); down = true; try { mini.cv.setPointerCapture(e.pointerId); } catch (er) { /* egal */ } jump(e); });
  mini.cv.addEventListener('pointermove', e => { if (down) jump(e); });
  for (const ev of ['pointerup', 'pointercancel']) mini.cv.addEventListener(ev, () => { down = false; });
  mini.cv.addEventListener('wheel', e => e.preventDefault(), { passive: false });   // kein Seiten-Zoom über der Karte
  const set = open => { miniOpen = open; try { localStorage.setItem(MINI_KEY, open ? 'auf' : 'zu'); } catch (e) { /* privat */ } mini.view = ''; miniTick(performance.now()); };
  box.querySelector('.mini-x').onclick = () => set(false);
  box.querySelector('.mini-open').onclick = () => set(true);
}
// jedes Bild (main.js): zeigen/verstecken, bei Änderung neu malen, Sichtfeld-Rahmen
function miniTick(now) {
  const want = miniWanted() && $('modal').hidden && !sheetOpen;
  if (!mini) { if (!want) return; miniBuild(); }
  mini.box.hidden = !want;
  mini.box.classList.toggle('zu', !miniOpen);
  if (!want || !miniOpen) return;
  const sig = miniSig();
  if (sig !== mini.sig && now - mini.at > MINI_EVERY && !mini.wait) {         // neu malen in einer Pause (~17 ms bei großer Welt)
    mini.sig = sig; mini.at = now; mini.wait = true;
    const go = () => { mini.wait = false; miniPaint(); mini.view = ''; };
    if (!mini.base) go(); else if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 1000 }); else setTimeout(go, 0);
  }
  const b = mini.base, view = [Math.round(cam.x), Math.round(cam.y), cam.z.toFixed(3), W, H, mini.at].join('|');
  if (!b || view === mini.view) return;
  mini.view = view;
  const dpr = window.devicePixelRatio || 1, k = Math.min(MINI_W / b.width, MINI_H / b.height), w = Math.round(b.width * k), h = Math.round(b.height * k), cv = mini.cv;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  const c2 = cv.getContext('2d');
  if (!c2) return;
  const s = cv.width / b.width;
  c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, cv.width, cv.height);
  c2.imageSmoothingEnabled = true; c2.drawImage(b, 0, 0, cv.width, cv.height);
  const [cx, cy] = miniOf(cam.x, cam.y), hw = W / 2 / cam.z / (TW / 2), hh = H / 2 / cam.z / TH;   // Sichtfeld in Kartenpunkten
  c2.lineWidth = 1.5 * dpr; c2.strokeStyle = '#5a3e2b'; c2.fillStyle = 'rgba(255,255,255,0.18)';
  c2.beginPath(); c2.rect((cx - hw) * s, (cy - hh) * s, 2 * hw * s, 2 * hh * s); c2.fill(); c2.stroke();
}
