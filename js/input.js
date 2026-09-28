'use strict';
// ---------------------------------------------------------------------------
// Kamera & Eingabe
// ---------------------------------------------------------------------------
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
let g = ctx;
let W = 0, H = 0, DPR = 1;
let cam;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
}
function toScreen(x, y) {
  const p = iso(x, y);
  return { x: (p.x - cam.x) * cam.z + W / 2, y: (p.y - cam.y) * cam.z + H / 2 };
}
function toTile(sx, sy) {
  const px = (sx - W / 2) / cam.z + cam.x, py = (sy - H / 2) / cam.z + cam.y;
  const a = (px / (TW / 2) + py / (TH / 2)) / 2, b = (py / (TH / 2) - px / (TW / 2)) / 2;
  return { x: Math.round(a), y: Math.round(b) };
}
function clampCam() {
  const c = iso(ISLAND.cx, ISLAND.cy), rx = ISLAND.r * TW * 0.8, ry = ISLAND.r * TH * 0.8;
  cam.x = Math.max(c.x - rx, Math.min(c.x + rx, cam.x));
  cam.y = Math.max(c.y - ry, Math.min(c.y + ry, cam.y));
}
function zoomAt(px, py, nz) {
  nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nz));
  const wx = (px - W / 2) / cam.z + cam.x, wy = (py - H / 2) / cam.z + cam.y;
  cam.z = nz;
  cam.x = wx - (px - W / 2) / nz;
  cam.y = wy - (py - H / 2) / nz;
  clampCam();
}

const pointers = new Map();
let drag = null, pinch = null, moved = false, painting = false, lastPaint = null, paintMode = null, paintAxis = null;

// Kante unter dem Finger: die nächstgelegene Grenze des Feldes
function edgeAt(sx, sy, axis) {
  const px = (sx - W / 2) / cam.z + cam.x, py = (sy - H / 2) / cam.z + cam.y;
  const a = (px / (TW / 2) + py / (TH / 2)) / 2, b = (py / (TH / 2) - px / (TW / 2)) / 2;
  const x = Math.round(a), y = Math.round(b), u = a - x, v = b - y;
  // axis 'u': nur Grenzen zu x±1, 'v': nur zu y±1 (beim Ziehen bleibt der Pinsel in einer Richtung)
  const useU = axis ? axis === 'u' : Math.abs(u) > Math.abs(v);
  const [dx, dy] = useU ? [Math.sign(u) || 1, 0] : [0, Math.sign(v) || 1];
  return { x, y, dx, dy, key: edgeKey(x, y, dx, dy) };
}
let hoverEdge = null, hoverSlot = 0;
function toggleEdge(e, quiet) {
  const ox = e.x + e.dx, oy = e.y + e.dy;
  if (!ownedTile(e.x, e.y) && !ownedTile(ox, oy)) { if (!quiet) fail('Das ist nicht dein Grundstück'); return; }
  if (isWater(e.x, e.y) && isWater(ox, oy)) return;
  const style = currentStyle('gehweg');
  // Erste Kante entscheidet: gleicher Stil → entfernen, sonst legen bzw. umfärben
  if (paintMode == null) paintMode = state.walks.get(e.key) !== style;
  if (paintMode) { if (state.walks.get(e.key) === style) return; state.walks.set(e.key, style); }
  else { if (!state.walks.has(e.key)) return; state.walks.delete(e.key); }
  sfx('road');
  recalc();
  save();
}
function paintAt(sx, sy) {
  if (tool === 'gehweg') {
    const e = edgeAt(sx, sy, paintAxis);
    if (!paintAxis) paintAxis = e.dx ? 'u' : 'v';
    hoverEdge = e;
    if (e.key === lastPaint) return;
    lastPaint = e.key;
    toggleEdge(e, true);
    return;
  }
  const t = toTile(sx, sy);
  const k = t.x + ',' + t.y;
  if (k === lastPaint) return;
  lastPaint = k;
  hover = t;
  previewCache = null;
  if (ownedTile(t.x, t.y)) build(tool, t.x, t.y, true);
}

canvas.addEventListener('pointerdown', e => {
  audio();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ohne Capture weiter */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    moved = false;
    painting = false;
    lastPaint = null;
    drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, button: e.button };
    if (tool !== 'look' && ITEMS[tool].paint && e.button === 0) { painting = true; paintMode = null; paintAxis = null; paintAt(e.clientX, e.clientY); }
  } else if (pointers.size === 2) {
    painting = false;
    const [a, b] = [...pointers.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cx: cam.x, cy: cam.y };
    moved = true;
  }
});
canvas.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
    const wx = (pinch.mx - W / 2) / pinch.z + pinch.cx, wy = (pinch.my - H / 2) / pinch.z + pinch.cy;
    cam.z = nz;
    cam.x = wx - (mx - W / 2) / nz;
    cam.y = wy - (my - H / 2) / nz;
    clampCam();
    return;
  }
  if (painting && pointers.size === 1) { paintAt(e.clientX, e.clientY); return; }
  if (drag && pointers.size === 1) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) > 6) { moved = true; canvas.style.cursor = 'grabbing'; }
    if (moved) { cam.x = drag.cx - dx / cam.z; cam.y = drag.cy - dy / cam.z; clampCam(); }
    return;
  }
  if (e.pointerType === 'mouse') setHover(e.clientX, e.clientY);
});
function endPointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 1) {
    const p = [...pointers.values()][0];
    drag = { x: p.x, y: p.y, cx: cam.x, cy: cam.y, button: 0 };
    painting = false;
  } else if (pointers.size === 0) {
    if (painting) painting = false;
    else if (drag && !moved && e.type === 'pointerup') {
      if (drag.button === 2) setTool('look');
      else tap(e.clientX, e.clientY, e.pointerType !== 'mouse');
    }
    drag = null;
    canvas.style.cursor = '';
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !drag) { hover = null; hoverChunk = null; } });
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, cam.z * Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());

function setHover(sx, sy) {
  if (tool === 'gehweg') hoverEdge = edgeAt(sx, sy);
  hoverSlot = slotAt(sx, sy).slot;
  const t = toTile(sx, sy);
  if (!hover || hover.x !== t.x || hover.y !== t.y) { hover = t; previewCache = null; }
  const ck = chunkOf(t.x, t.y);
  hoverChunk = purchasable(ck) ? ck : null;
}

window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'Escape') { setTool('look'); closePanel(); closeModal(); return; }
  if (!document.getElementById('modal').hidden) return;
  if ((e.key === 'r' || e.key === 'R') && ROTATABLE.has(tool)) { rotateBuild(); return; }
  const list = Object.keys(ITEMS).filter(id => ITEMS[id].cat === cat);
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= list.length) setTool(list[n - 1]);
});
