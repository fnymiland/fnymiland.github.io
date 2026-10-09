'use strict';
// ---------------------------------------------------------------------------
// Anhöhen (Block 157, Relief wie bei Animal Crossing): Felder liegen eine Ebene höher. `state.hills`: Feld → { w: Wandart, h?: Ebene
// (fehlt = 1) }. Alles auf dem Feld wird angehoben gezeichnet (render.js tileA/tileB), die Oberseite ist der normale Boden (drawGround),
// sichtbare Wände (+x, +y), wo das Nachbarfeld tiefer liegt. Stufe 1: oben nur Deko, Bäume, Bänke und Gelände; Wege und Gebäude später.
// ---------------------------------------------------------------------------
const HILL_H = 26;                                                       // eine Ebene (so hoch wie die Steinarkaden)
const HILL_WALLS = ['fels', 'erde', 'mauer'];
const HILL_STY = {
  fels: { v: '#a69a8c', u: '#8a7f73', line: 'rgba(70,60,50,0.35)', lip: '#86c35b', lipH: 2.2 },
  erde: { v: '#a57a52', u: '#8a6342', line: 'rgba(60,40,25,0.35)', lip: '#7fbf55', lipH: 4 },
  mauer: { v: '#cbbda4', u: '#b2a48b', line: 'rgba(90,75,55,0.45)', lip: '#8fcf68', lipH: 2.2 },
};
const hillAt = (x, y) => (state.hills && state.hills.size && state.hills.get(x + ',' + y)) || null;
const hillLevel = (x, y) => { const h = hillAt(x, y); return h ? (h.h || 1) : 0; };
const hillLift = (x, y) => hillLevel(x, y) * HILL_H;
const hillWall = h => HILL_WALLS[(h && h.w) || 0] || 'fels';
// Gleiche Höhe auf allen Feldern (große Deko, Eckpunkt-Deko)
const sameLevel = tiles => tiles.every(([x, y]) => hillLevel(x, y) === hillLevel(tiles[0][0], tiles[0][1]));

// --- Was darf auf eine Anhöhe (Stufe 1) ---
// Deko-Felder (Brunnen, Beete, Statuen …), Kleinkram, Gelände-Pinsel; keine Gebäude, Wege, Schienen, Dächer, Stationen
// (Parkbahn und Seilbahn-Station sind cat 'deko', fahren/hängen aber am Boden)
const HILL_NO = new Set(['dach', 'dachtreppe', 'stuetze', 'pb_gleis', 'pb_station', 'seilbahn']);
const hillOk = b => { const d = ITEMS[b]; return !!d && (b === 'anhoehe' || b === 'tunnel' || !!TERRAFORM[b] || (d.cat === 'deko' && !d.edge && !HILL_NO.has(b))); };
// Fehler, wenn b auf (Teilen von) tiles nicht stehen darf
function hillError(b, tiles) {
  if (!state.hills || !state.hills.size) return null;
  const up = tiles.some(([x, y]) => hillAt(x, y));
  if (!up) return null;
  if (!hillOk(b)) return b === 'weg' || b === 'schiene' || b === 'pb_gleis' ? 'Wege und Schienen auf Anhöhen kommen später' : 'Gebäude auf Anhöhen kommen später – oben geht Deko';
  if (!sameLevel(tiles)) return 'Nicht über die Kante einer Anhöhe';
  return null;
}
// Ein Feld anheben? (Rechteck aufziehen, plan.js)
function hillRaiseError(x, y, noCost) {
  if (!available('anhoehe')) return `Anhöhe: ${lockText('anhoehe').replace('🔒 ', 'erst mit ')}`;
  if (!ownedTile(x, y)) return notMine(x, y);
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  const t = objAt(x, y);
  if (t) {
    if (!hillOk(t.b) || t.b === 'tunnel') return t.b === 'weg' ? 'Auf einem Weg geht keine Anhöhe (Wege oben kommen später)' : 'Hier steht ein Gebäude';
    const [w, h] = sizeOf(t.b, t.rot || 0, t);
    if (w > 1 || h > 1) return 'Große Deko erst wegnehmen – sie kommt danach auf die fertige Anhöhe';
    if (wegUnder(t) != null) return 'Hier liegt ein Weg darunter';
  }
  const ds = decosAt(x + ',' + y);                                       // Stütze im Eck-/Seitenplatz (geht auch ohne Dach): oben gibt es keine (smallError)
  if (ds && ds.some(d => d && baseOf(d.b) === 'stuetze')) return 'Hier steht eine Stütze – erst wegnehmen';
  if (state.roofs && roofAt(x, y)) return 'Unter einer Überdachung geht keine Anhöhe';
  for (const k of ['a' + x + ',' + y, 'a' + x + ',' + (y + 1), 'b' + x + ',' + y, 'b' + (x + 1) + ',' + y]) if (state.edges.has(k)) return `Am Rand steht: ${ITEMS[state.edges.get(k).b].name} – erst entfernen`;
  for (const [vx, vy] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (postAt(vx, vy)) return 'An der Ecke steht schon etwas';
  if (noCost) return null;
  if (state.money < ITEMS.anhoehe.cost) return 'Zu wenig Taler';
  return matError(ITEMS.anhoehe.mat);
}
function raiseHill(x, y) {
  const k = x + ',' + y, w = decoLookNew('anhoehe').form || 0, h = hillAt(x, y);
  if (h) { if ((h.w || 0) === w) return false; h.w = w; groundVersion++; sfx('deco'); recalc(); save(); return true; }   // nur die Wand umstellen
  const err = hillRaiseError(x, y);
  if (err) { fail(err); return false; }
  state.money -= ITEMS.anhoehe.cost; payMat(ITEMS.anhoehe.mat);
  state.hills.set(k, { w });
  groundVersion++; sfx('dig'); recalc(); save();
  return true;
}
// Abtragen: voll zurück; was oben steht, landet unten
function lowerHill(x, y) {
  const k = x + ',' + y;
  if (!state.hills.has(k)) return false;
  state.hills.delete(k);
  const e = hillSprites.get(k);                                          // Bildchen gleich freigeben
  if (e) { freeCanvas(e.c); hillSprites.delete(k); }
  state.money += ITEMS.anhoehe.cost;
  for (const [r, n] of Object.entries(ITEMS.anhoehe.mat || {})) state.res[r] += n;
  addFloat(x, y, '+' + fmt(ITEMS.anhoehe.cost), '#3f8f43');
  groundVersion++; sfx('dig'); recalc(); save();
  return true;
}
// alle verbundenen Felder gleicher Höhe (Wandart für die ganze Anhöhe umstellen)
function hillGroup(x, y) {
  const lv = hillLevel(x, y), out = [], seen = new Set([x + ',' + y]), q = [[x, y]];
  while (q.length && out.length < 2000) {
    const [cx, cy] = q.shift(); out.push([cx, cy]);
    for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, nk = nx + ',' + ny; if (!seen.has(nk) && hillLevel(nx, ny) === lv) { seen.add(nk); q.push([nx, ny]); } }
  }
  return out;
}
function setHillWall(x, y, w) {
  let n = 0;
  for (const [hx, hy] of hillGroup(x, y)) { const h = hillAt(hx, hy); if (h && (h.w || 0) !== w) { h.w = w; n++; } }
  if (n) { groundVersion++; sfx('deco'); recalc(); save(); }
  return n;
}

// --- Zeichnen: je Feld ein Bildchen (Oberseite + sichtbare Wände), wie die Dächer ---
const hillSprites = new Map(), HILL_BUDGET = 6;   // ms je Bild fürs Neumalen nach dem Zoomen; danach das alte Bildchen (andere Stufe) weiter
let hillPaintMs = 0, hillPaintFrame = -1;
const HILL_BOX = { left: -TW / 2 - 3, top: -TH / 2 - HILL_H - 8, w: TW + 6, h: TH + HILL_H + 14 };
function hillSig(x, y, h) {
  const lv = h.h || 1, wu = lv - hillLevel(x + 1, y), wv = lv - hillLevel(x, y + 1);
  let s = (h.w || 0) + ':' + wu + ':' + wv + ':' + (hillLevel(x - 1, y) < lv ? 1 : 0) + (hillLevel(x, y - 1) < lv ? 1 : 0) + ':' + terrainAt(x, y) + ':' + (terraLook(x, y) || '') + ':' + (COVER.has(x + ',' + y) ? 1 : 0) + ':' + (isBeach(x, y) ? 1 : 0);
  if (terraLook(x, y) === 'park' || terraLook(x, y) === 'fz') {          // Parkrand (drawGround): Nachbarn und ☰ „Ränder aus“
    s += state.noBorders ? 'r' : '';
    for (const [dx, dy] of DIRS) s += terraLook(x + dx, y + dy) === terraLook(x, y) ? 1 : 0;
  }
  return s;
}
// eine Wand von (a0, b0) nach (a1, b1) (Feldkoordinaten relativ zum Feld), Höhe hb..ht, nach +x ('u') bzw. +y ('v')
function paintHillWall(P, a0, b0, a1, b1, dir, kind, hb, ht, seed) {
  const S = HILL_STY[kind], at = (s, h) => P(a0 + (a1 - a0) * s, b0 + (b1 - b0) * s, h), H = ht - hb;
  const quad = [at(0, hb), at(1, hb), at(1, ht), at(0, ht)];
  poly(quad, C(dir === 'u' ? S.u : S.v));
  g.save(); g.beginPath(); quad.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
  const line = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); };
  const r = i => hash(seed, i, 157);
  if (kind === 'fels') {                                                 // Schichten und Risse
    for (let k = 1; k < 5; k++) { const pts = []; for (let i = 0; i <= 6; i++) pts.push(at(i / 6, hb + k * H / 5 + (r(k * 7 + i) - 0.5) * 3)); line(pts, S.line, 0.9); }
    for (let c = 0; c < 3; c++) { const s = 0.18 + 0.3 * c + r(50 + c) * 0.1; line([at(s, hb + H * 0.85), at(s + 0.05, hb + H * 0.55), at(s - 0.02, hb + H * 0.3)], S.line, 0.8); }
  } else if (kind === 'erde') {                                          // Wurzeln und Steinchen
    for (let c = 0; c < 4; c++) { const s = 0.15 + 0.22 * c; line([at(s, ht - 3), at(s + 0.03, ht - 8 - r(60 + c) * 6)], 'rgba(70,45,25,0.5)', 0.7); }
    for (let c = 0; c < 6; c++) { const p = at(r(70 + c) * 0.9 + 0.05, hb + 3 + r(80 + c) * (H - 10)); g.beginPath(); g.ellipse(p[0], p[1], 1.6, 1.1, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(200,185,160,0.8)'; g.fill(); }
  } else {                                                               // Trockenmauer: Steine im Verband
    const rows = 5, n = 4;
    for (let k = 0; k < rows; k++) {
      const h0 = hb + k * H / rows, h1 = hb + (k + 1) * H / rows, off = k % 2 ? 0.5 / n : 0;
      line([at(0, h1), at(1, h1)], S.line, 0.9);
      for (let i = 0; i <= n; i++) { const s = i / n + off; if (s > 0 && s < 1) line([at(s, h0), at(s, h1)], S.line, 0.9); }
    }
  }
  g.restore();
  const lip = [];                                                        // Grasnarbe oben (wellig)
  for (let i = 0; i <= 8; i++) lip.push(at(i / 8, ht + 0.4));
  for (let i = 8; i >= 0; i--) lip.push(at(i / 8, ht - S.lipH - r(90 + i) * S.lipH * 0.7));
  poly(lip, C(S.lip));
}
function paintHill(x, y, h) {
  const lv = h.h || 1, top = lv * HILL_H, kind = hillWall(h);
  const P = (u, v, up = 0) => [(u - v) * TW / 2, (u + v) * TH / 2 - up];   // relativ zur Feldmitte
  drawGround(x, y, { x: 0, y: -top }, 1, 0, true);                       // Oberseite: der Boden, angehoben
  const wv = lv - hillLevel(x, y + 1), wu = lv - hillLevel(x + 1, y);
  // Kante oben zur tieferen Seite hinten (Nutzer: Oberseite hob sich hinten nicht von der Wiese ab) – wie im Konzeptbild
  g.strokeStyle = 'rgba(45,85,30,0.5)'; g.lineWidth = 1.5; g.lineCap = 'round';
  for (const [lower, a, b] of [[hillLevel(x - 1, y) < lv, [-0.5, -0.5], [-0.5, 0.5]], [hillLevel(x, y - 1) < lv, [-0.5, -0.5], [0.5, -0.5]]]) {
    if (!lower) continue;
    const p = P(a[0], a[1], top), q = P(b[0], b[1], top);
    g.beginPath(); g.moveTo(p[0], p[1] + 0.6); g.lineTo(q[0], q[1] + 0.6); g.stroke();
  }
  if (wv > 0) paintHillWall(P, -0.5, 0.5, 0.5, 0.5, 'v', kind, top - wv * HILL_H, top, x * 7 + y * 13);
  if (wu > 0) paintHillWall(P, 0.5, -0.5, 0.5, 0.5, 'u', kind, top - wu * HILL_H, top, x * 11 + y * 5 + 3);
}
function drawHillTile(x, y, px, py, z) {
  const h = hillAt(x, y);
  if (!h) return;
  const want = DPR * Math.pow(2, Math.ceil(Math.log2(Math.max(z, 0.2)) * 2 - 1e-9) / 2), key = x + ',' + y;
  let e = hillSprites.get(key);
  // Schlüssel nur neu rechnen, wenn sich am Spielstand etwas getan hat (wie die Dächer); nach dem Zoomen im Zeitbudget neu malen
  const ver = groundVersion + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + state.hills.size + (FOG ? 'n' : '');
  const base = e && e.ver === ver ? e.base : hillSig(x, y, h) + (FOG ? 'n' : ''), sig = base + '|' + want.toFixed(3);
  if (e && e.base === base) e.ver = ver;
  if (hillPaintFrame !== frameNo) { hillPaintFrame = frameNo; hillPaintMs = 0; }
  if (!e || (e.sig !== sig && !(e.base === base && hillPaintMs > HILL_BUDGET))) {
    if (hillSprites.size > state.hills.size + 64) for (const k of hillSprites.keys()) if (!state.hills.has(k)) { freeCanvas(hillSprites.get(k).c); hillSprites.delete(k); }   // ↶ & Co.
    const t0 = performance.now(), B = HILL_BOX, c = document.createElement('canvas');
    c.width = Math.ceil(B.w * want); c.height = Math.ceil((B.h + ((h.h || 1) - 1) * HILL_H) * want);
    const cg = c.getContext('2d');
    if (!cg) return;
    const prev = g; g = cg;
    try { g.setTransform(want, 0, 0, want, -B.left * want, (-B.top + ((h.h || 1) - 1) * HILL_H) * want); paintHill(x, y, h); } finally { g = prev; }
    if (e) freeCanvas(e.c);
    e = { c, sig, base, ver, up: ((h.h || 1) - 1) * HILL_H };
    hillSprites.set(key, e);
    hillPaintMs += performance.now() - t0;
  }
  const B = HILL_BOX;
  g.drawImage(e.c, px + B.left * z, py + (B.top - e.up) * z, B.w * z, (B.h + e.up) * z);
}
// Schatten am Boden (im Boden-Bild, wie Dächer): die Grundfläche, mit der Sonne verschoben
function drawHillShadows(want) {
  if (!state.hills || !state.hills.size) return;
  g.beginPath();
  for (const [k, h] of state.hills) {
    const [x, y] = keyXY(k);
    if (!want([x, y])) continue;
    const H = (h.h || 1) * HILL_H, dx = SUN.dx * H, dy = SUN.dy * H;
    const c = [[x - 0.5, y - 0.5], [x + 0.5, y - 0.5], [x + 0.5, y + 0.5], [x - 0.5, y + 0.5]].map(([u, v]) => { const p = iso(u, v); return [p.x + dx, p.y + dy]; });
    c.forEach((p, n) => n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
  }
  g.fillStyle = 'rgba(30,42,62,0.22)'; g.fill('nonzero');
}

// --- Antippen in der Höhe ---
// Feld unter dem Zeiger samt Höhe: der Strahl von vorn oben nach hinten unten; das erste Feld, in dessen Block er steckt, gilt.
// Liefert [a, b] (Feldkoordinaten auf der getroffenen Höhe) – wie tileFrac, nur mit Anhöhen
// Anhöhe unter dem Zeiger (Oberseite oder Wand): verdeckt sie, was dahinter steht (Stützen, Deko auf Dächern)?
function hillHit(sx, sy) {
  if (!state.hills || !state.hills.size || !cam) return null;
  for (let t = HILL_H; t > 0; t -= 2) { const [a, b] = tileFrac(sx, sy + t * cam.z), x = Math.round(a), y = Math.round(b); if (hillLift(x, y) >= t) return { x, y }; }
  return null;
}
const hillInFront = (sx, sy, x, y) => { const h = hillHit(sx, sy); return !!h && h.x + h.y > x + y; };
function pickFrac(sx, sy) {
  if (!state.hills || !state.hills.size || !cam) return tileFrac(sx, sy);
  const maxLv = 1, top = maxLv * HILL_H;
  for (let t = top; t > 0; t -= 2) {
    const [a, b] = tileFrac(sx, sy + t * cam.z), x = Math.round(a), y = Math.round(b), lift = hillLift(x, y);
    if (lift >= t) return [a, b];                                          // oben oder an seiner Wand getroffen
  }
  return tileFrac(sx, sy);
}
