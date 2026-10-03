'use strict';
// ---------------------------------------------------------------------------
// Kamera & Eingabe
// ---------------------------------------------------------------------------
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
let g = ctx;
let W = 0, H = 0, DPR = 1;
let cam;
// Handy: kürzere Bildschirmseite unter 540 px (hoch oder quer). iPad und Desktop sind nie „phone“ –
// alles Handy-Eigene hängt an dieser einen Stelle (CSS: body.phone / body.phone-land)
let PHONE = false;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  const was = PHONE;
  PHONE = Math.min(W, H) < 540;
  document.body.classList.toggle('phone', PHONE);
  document.body.classList.toggle('phone-land', PHONE && W > H);
  if (!PHONE) setSheet(false);
  if (was !== PHONE && typeof updateHint === 'function') updateHint();
}
function toScreen(x, y) {
  const p = iso(x, y);
  return { x: (p.x - cam.x) * cam.z + W / 2, y: (p.y - cam.y) * cam.z + H / 2 };
}
function tileFrac(sx, sy) {
  const px = (sx - W / 2) / cam.z + cam.x, py = (sy - H / 2) / cam.z + cam.y;
  return [(px / (TW / 2) + py / (TH / 2)) / 2, (py / (TH / 2) - px / (TW / 2)) / 2];
}
function toTile(sx, sy) { const [a, b] = tileFrac(sx, sy); return { x: Math.round(a), y: Math.round(b) }; }
// Zaun & Co. (Block 41): der nächste Eckpunkt zwischen den Feldern
function toVertex(sx, sy) { const [a, b] = tileFrac(sx, sy); return { x: Math.round(a + 0.5), y: Math.round(b + 0.5) }; }
const planPoint = (sx, sy) => (plan ? plan.kind === 'edge' : dragKind(tool) === 'edge') ? toVertex(sx, sy) : toTile(sx, sy);
// Liegt der Zeiger auf einer Linie? (Abreißen, Ansehen) – die Kante, deren Mitte am nächsten ist
function edgeNear(sx, sy) {
  const [a, b] = tileFrac(sx, sy), gu = Math.round(a - 0.5) + 0.5, gv = Math.round(b - 0.5) + 0.5;
  const cand = [];
  if (Math.abs(a - gu) < 0.2) cand.push(['b' + (gu + 0.5) + ',' + Math.round(b), Math.abs(a - gu)]);
  if (Math.abs(b - gv) < 0.2) cand.push(['a' + Math.round(a) + ',' + (gv + 0.5), Math.abs(b - gv)]);
  const hit = cand.filter(([k]) => state.edges.has(k)).sort((p, q) => p[1] - q[1])[0];
  return hit ? hit[0] : null;
}
function clampCam() {
  const c = iso(ISLAND.cx, ISLAND.cy), R = WORLD.R, rx = R * TW * 0.75, ry = R * TH * 0.75;   // wächst mit der Welt
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
let drag = null, pinch = null, moved = false;
// Karte ziehen, egal welches Werkzeug man hält: rechte oder mittlere Maustaste, Leertaste oder Ctrl gedrückt
// (Ctrl-Klick ist am Mac der Rechtsklick; mit dem Trackpad geht so das Ziehen am leichtesten)
let spaceDown = false;
const panButton = e => e.button === 1 || e.button === 2 || (e.buttons & 6) !== 0 || e.ctrlKey || spaceDown;

let hoverSlot = 0, hoverVertex = null, hoverEdge = null;

canvas.addEventListener('pointerdown', e => {
  audio();
  if (sheetOpen) setSheet(false);                     // Handy: Tippen auf die Karte klappt den Katalog zu
  if (PHONE && buildInfo) closePanel();               // … und das Bau-Infofenster (es verdeckt sonst den Bauplatz)
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ohne Capture weiter */ }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    moved = false;
    const pan = panButton(e);
    drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, button: e.button, pan, right: e.button === 2 || (e.ctrlKey && e.button === 0) };
    // Mit Weg, Schiene oder Gelände in der Hand zieht man eine Linie bzw. ein Rechteck auf (erst Vorschau)
    if (pan) canvas.style.cursor = 'grabbing';
    else if (e.button === 0 && tool !== 'look' && dragKind(tool)) { drag.plan = dragKind(tool) === 'edge' ? toVertex(e.clientX, e.clientY) : toTile(e.clientX, e.clientY); drag.slot = slotAt(e.clientX, e.clientY).slot; }
  } else if (pointers.size === 2) {
    if (plan && plan.dragging) plan = null;              // zweiter Finger: doch lieber Karte bewegen
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
  if (drag && pointers.size === 1) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) > (drag.pan ? 3 : 6)) {
      moved = true;
      if (drag.plan && dragKind(tool)) { planTouch = e.pointerType !== 'mouse'; startPlan(dragKind(tool), drag.plan, drag.plan, false, drag.slot); plan.dragging = true; }
      else canvas.style.cursor = 'grabbing';
    }
    if (moved && plan && plan.dragging) { setPlanEnd(planPoint(e.clientX, e.clientY)); hover = toTile(e.clientX, e.clientY); return; }
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
  } else if (pointers.size === 0) {
    if (plan && plan.dragging && plan.tool === 'verschieben') {         // Auswahl: alles darin anheben
      const [x0, y0, x1, y1] = planBox(plan);
      plan = null;
      undoable(() => pickUpGroup(x0, y0, x1, y1));
    } else if (plan && plan.dragging) { plan.dragging = false; plan.fixed = true; }   // Vorschau bleibt stehen
    else if (drag && !moved && e.type === 'pointerup') {
      if (drag.right) { if (plan) cancelPlan(); else setTool('look'); }   // Rechtsklick: erst die Planung, dann das Werkzeug weg
      else if (!drag.pan) { const go = () => tap(e.clientX, e.clientY, e.pointerType !== 'mouse'); if (tool !== 'look' || moving) undoable(go); else go(); }   // Bauen & Co.: ein Schritt zum Zurücknehmen
    }
    drag = null;
    canvas.style.cursor = spaceDown ? 'grab' : '';
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !drag) { hover = null; hoverChunk = null; } });
// Mausrad: beim Bauen/Verschieben drehbarer Dinge dreht es, sonst zoomt es (Zwei-Finger-Zoom = ctrlKey zoomt immer)
let wheelAcc = 0, wheelLast = 0;
const wheelRotates = () => tool === 'verschieben' ? !!moving && ROTATABLE.has(movingType()) : tool !== 'look' && ROTATABLE.has(tool);
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  if (!e.ctrlKey && wheelRotates()) {
    const now = performance.now();
    if (now - wheelLast > 400) wheelAcc = 0;
    wheelLast = now;
    wheelAcc += e.deltaMode ? e.deltaY * 40 : e.deltaY;
    if (Math.abs(wheelAcc) >= 50) { rotateBuild(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; }
    return;
  }
  zoomAt(e.clientX, e.clientY, cam.z * Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());

function setHover(sx, sy) {
  const sa = slotAt(sx, sy);
  hoverSlot = sa.slot;
  const t = sa.slot === VSLOT ? { x: sa.x, y: sa.y } : toTile(sx, sy);   // Eckpunkt (Block 65): gehört zum Feld unter der Ecke
  if (!hover || hover.x !== t.x || hover.y !== t.y) { hover = t; previewCache = null; }
  hoverVertex = toVertex(sx, sy); hoverEdge = tool === 'abriss' || tool === 'look' ? edgeNear(sx, sy) : null;
  if (plan && !plan.fixed) setPlanEnd(planPoint(sx, sy));   // Linie per Klick begonnen: das Ende folgt der Maus
  hoverChunk = null;
}

window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === ' ' && document.getElementById('modal').hidden) {   // Leertaste halten: Karte ziehen
    e.preventDefault();
    if (!spaceDown) { spaceDown = true; if (!drag) canvas.style.cursor = 'grab'; }
    return;
  }
  if (e.key === 'Escape') { if (plan) cancelPlan(); else { setTool('look'); closePanel(); closeModal(); } return; }
  if (!document.getElementById('modal').hidden) return;
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo(); return; }   // Rückgängig
  if ((e.key === 'r' || e.key === 'R') && (wheelRotates() || ROTATABLE.has(tool))) { rotateBuild(); return; }
  if (e.repeat) return;                              // gedrückt halten schaltet nicht hin und her
  const quick = { a: 'look', w: 'weg', v: 'verschieben', e: 'abriss', Delete: 'abriss', Backspace: 'abriss' }[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (quick) { setTool(tool === quick && quick !== 'look' ? 'look' : quick); return; }
  const list = menuList();                           // wie die Leiste: Freigeschaltetes zuerst
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= list.length) pickCard(list[n - 1]);
});
window.addEventListener('keyup', e => { if (e.key === ' ') { spaceDown = false; if (!drag) canvas.style.cursor = ''; } });
window.addEventListener('blur', () => { spaceDown = false; });
