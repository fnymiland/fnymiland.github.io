'use strict';
// ---------------------------------------------------------------------------
// Anhöhen (Block 157, Relief wie bei Animal Crossing): Felder liegen eine Ebene höher. `state.hills`: Feld → { w: Wandart, h?: Ebene
// (fehlt = 1) }. Alles auf dem Feld wird angehoben gezeichnet (render.js tileA/tileB), die Oberseite ist der normale Boden (drawGround),
// sichtbare Wände (+x, +y), wo das Nachbarfeld tiefer liegt. Stufe 1: oben nur Deko, Bäume, Bänke und Gelände; Wege und Gebäude später.
// Hinauf führt die Treppe (Block 157d, unten in dieser Datei).
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
const HILL_NO = new Set(['dach', 'dachtreppe', 'stuetze', 'pb_gleis', 'pb_station', 'seilbahn', 'huegeltreppe']);   // Treppe (157d): steht unten
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
    if (t.b === 'huegeltreppe') return 'Hier steht eine Treppe – erst abreißen';   // Treppe (Block 157d)
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
  if (stairsAround(x, y, true).length) return 'Vor dem Fuß der Treppe muss Platz bleiben';   // Treppe (Block 157d): sonst führte sie in eine Wand
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
  if (stairsAround(x, y).length) return false;                           // Treppe (Block 157d) führt hinauf: erst die Treppe (demolishInfo sagt es)
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
  const st = hillStairEnds(x, y);                                        // Treppe (Block 157d): dort keine Grasnarbe bzw. keine Kante
  if (st) s += ':t' + st;
  return s;
}
// Treppen, die auf Feld (x, y) hinaufführen, als Zeichen je Seite: v/u = vorn (+y/+x, Wand ohne Grasnarbe – die Stufen decken sie),
// U/V = hinten (−x/−y, keine dunkle Kante oben – die oberste Stufe schließt bündig an). '' = keine
function hillStairEnds(x, y) {
  if (!stairFresh().n) return '';
  let s = '';
  for (const [c, r, dx, dy] of [['v', 0, 0, 1], ['u', 3, 1, 0], ['U', 1, -1, 0], ['V', 2, 0, -1]]) { const t = stairAt(x + dx, y + dy); if (t && stairRotOf(t) === r) s += c; }
  return s;
}
// eine Wand von (a0, b0) nach (a1, b1) (Feldkoordinaten relativ zum Feld), Höhe hb..ht, nach +x ('u') bzw. +y ('v'). ht1: Höhe am Ende
// (Keil der Treppe, Block 157d: oben schräg; sonst = ht), lip false: ohne Grasnarbe
function paintHillWall(P, a0, b0, a1, b1, dir, kind, hb, ht, seed, ht1 = ht, lip = true) {
  const S = HILL_STY[kind], at = (s, h) => P(a0 + (a1 - a0) * s, b0 + (b1 - b0) * s, h), H = Math.max(ht, ht1) - hb, top = s => ht + (ht1 - ht) * s;
  const quad = [at(0, hb), at(1, hb), at(1, ht1), at(0, ht)];
  poly(quad, C(dir === 'u' ? S.u : S.v));
  g.save(); g.beginPath(); quad.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
  const line = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); };
  const r = i => hash(seed, i, 157);
  if (kind === 'fels') {                                                 // Schichten und Risse
    for (let k = 1; k < 5; k++) { const pts = []; for (let i = 0; i <= 6; i++) pts.push(at(i / 6, hb + k * H / 5 + (r(k * 7 + i) - 0.5) * 3)); line(pts, S.line, 0.9); }
    for (let c = 0; c < 3; c++) { const s = 0.18 + 0.3 * c + r(50 + c) * 0.1; line([at(s, hb + H * 0.85), at(s + 0.05, hb + H * 0.55), at(s - 0.02, hb + H * 0.3)], S.line, 0.8); }
  } else if (kind === 'erde') {                                          // Wurzeln und Steinchen
    for (let c = 0; c < 4; c++) { const s = 0.15 + 0.22 * c; line([at(s, top(s) - 3), at(s + 0.03, top(s) - 8 - r(60 + c) * 6)], 'rgba(70,45,25,0.5)', 0.7); }
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
  if (!lip) return;
  const pts = [];                                                        // Grasnarbe oben (wellig)
  for (let i = 0; i <= 8; i++) pts.push(at(i / 8, top(i / 8) + 0.4));
  for (let i = 8; i >= 0; i--) pts.push(at(i / 8, top(i / 8) - S.lipH - r(90 + i) * S.lipH * 0.7));
  poly(pts, C(S.lip));
}
function paintHill(x, y, h) {
  const lv = h.h || 1, top = lv * HILL_H, kind = hillWall(h), st = hillStairEnds(x, y);
  const P = (u, v, up = 0) => [(u - v) * TW / 2, (u + v) * TH / 2 - up];   // relativ zur Feldmitte
  // Oberseite: der Boden, angehoben – zugeschnitten auf ihre (leicht vergrößerte) Raute: drawGround malt darunter die Seiten des Bodens
  // (Brauntöne, 0,5 Punkte breiter als das Feld), die sonst an jeder Feldgrenze als feine Striche in der Grasnarbe der Wand standen
  const hw = TW / 2 + 0.5, hh = TH / 2 + 0.3;
  g.save(); g.beginPath(); g.moveTo(0, -top - hh); g.lineTo(hw, -top); g.lineTo(0, -top + hh); g.lineTo(-hw, -top); g.closePath(); g.clip();
  try { drawGround(x, y, { x: 0, y: -top }, 1, 0, true); } finally { g.restore(); }
  const wv = lv - hillLevel(x, y + 1), wu = lv - hillLevel(x + 1, y);
  // Kante oben zur tieferen Seite hinten (Nutzer: Oberseite hob sich hinten nicht von der Wiese ab) – wie im Konzeptbild
  g.strokeStyle = 'rgba(45,85,30,0.5)'; g.lineWidth = 1.5; g.lineCap = 'round';
  for (const [lower, a, b] of [[hillLevel(x - 1, y) < lv && !st.includes('U'), [-0.5, -0.5], [-0.5, 0.5]], [hillLevel(x, y - 1) < lv && !st.includes('V'), [-0.5, -0.5], [0.5, -0.5]]]) {
    if (!lower) continue;
    const p = P(a[0], a[1], top), q = P(b[0], b[1], top);
    g.beginPath(); g.moveTo(p[0], p[1] + 0.6); g.lineTo(q[0], q[1] + 0.6); g.stroke();
  }
  if (wv > 0) paintHillWall(P, -0.5, 0.5, 0.5, 0.5, 'v', kind, top - wv * HILL_H, top, x * 7 + y * 13, top, !st.includes('v'));
  if (wu > 0) paintHillWall(P, 0.5, -0.5, 0.5, 0.5, 'u', kind, top - wu * HILL_H, top, x * 11 + y * 5 + 3, top, !st.includes('u'));
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
    hillPurge();                                                         // ↶ & Co.
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
// Bildchen von Feldern, die keine Anhöhe (bzw. Treppe, 's' + Feld) mehr sind, freigeben – erst, wenn es deutlich mehr sind als nötig
function hillPurge() {
  if (hillSprites.size <= state.hills.size + stairFresh().n + 64) return;
  for (const k of hillSprites.keys()) if (!state.hills.has(k) && !(k[0] === 's' && k !== 'sg' && stairAt(...keyXY(k.slice(1))))) { freeCanvas(hillSprites.get(k).c); hillSprites.delete(k); }
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
  if (stairFresh().n) for (const [k, t] of state.tiles) {                // Treppe (Block 157d): ein Keil – hinten so hoch wie die Anhöhe
    if (!isStair(t)) continue;
    const [x, y] = keyXY(k);
    if (!want([x, y])) continue;
    const [Du, Dv] = STAIR_UP[stairRotOf(t)], H = HILL_H + STAIR_CAP, P = (u, v, up) => { const p = iso(x + u, y + v); return [p.x + SUN.dx * up, p.y + SUN.dy * up]; };
    const pts = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].flatMap(([u, v]) => u * Du + v * Dv > 0 ? [P(u, v, 0), P(u, v, H)] : [P(u, v, 0)]);
    let c = hull(pts), area = 0;
    for (let i = 0; i < c.length; i++) { const a = c[i], b = c[(i + 1) % c.length]; area += a[0] * b[1] - b[0] * a[1]; }
    if (area < 0) c = c.reverse();                                       // gleicher Drehsinn wie die Anhöhen: Überlappung bleibt Schatten
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
  const maxLv = 1, top = maxLv * HILL_H, stairs = stairFresh().n > 0;
  for (let t = top; t > 0; t -= 2) {
    const [a, b] = tileFrac(sx, sy + t * cam.z), x = Math.round(a), y = Math.round(b), lift = hillLift(x, y);
    if (lift >= t) return [a, b];                                          // oben oder an seiner Wand getroffen
    if (stairs && stairHeight(x, y, a, b) >= t) return [a, b];             // Treppe (Block 157d): die Stufe unter dem Zeiger – nicht die Anhöhe dahinter
  }
  return tileFrac(sx, sy);
}

// ---------------------------------------------------------------------------
// Treppe in die Anhöhe (Block 157d, Nutzer: „eingelassen – links und rechts Anhöhe, in der Mitte die Treppe“, Entwurf
// tools/treppe-entwurf.js): Ding 'huegeltreppe' auf einem Feld der Ebene 0, dahinter (STAIR_UP[rot]) eine Anhöhe genau eine Ebene höher.
// Die Stufen steigen auf dem Feld selbst von der Vorderkante (Boden) bis zur Hinterkante (Oberkante der Anhöhe). Liegt seitlich Anhöhe,
// ist ihre Wand die Wange; fehlt sie, bekommt die Treppe dort einen Keil in der Wandart der Anhöhe dahinter. Gleich gerichtete Treppen
// nebeneinander sind eine breite Treppe (keine Wangen dazwischen, Stufen laufen durch). Trittflächen im Wegstil (t.style, Muster im
// Weltraster wie die Wege), Stirnseiten etwas dunkler. Gezeichnet als Bildchen je Feld (hillSprites, Schlüssel 's' + Feld)
// ---------------------------------------------------------------------------
const STAIR_UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];                     // vom Treppenfeld zur Anhöhe, je t.rot & 3
const STAIR_N = 8, STAIR_CW = 0.1, STAIR_CAP = 3;                        // Stufen je Feld; Keil: Breite (Feld), so weit ragt er über die Stufen
const isStair = t => !!t && t.b === 'huegeltreppe';
const stairAt = (x, y) => { const t = state.tiles.get(x + ',' + y); return isStair(t) ? t : null; };
const stairRotOf = t => (t.rot || 0) & 3;
// alle Treppen (gemerkt je Boden-Fassung wie rfFresh): list = die, hinter denen Anhöhe liegt; n = alle Treppenfelder
let stairCache = { ver: '', list: [], n: 0 };
function stairFresh() {
  if (!state.hills || !state.hills.size) return stairCache.n ? (stairCache = { ver: '', list: [], n: 0 }) : stairCache;   // ohne Anhöhen keine Treppen
  const v = groundVersion + ':' + state.tiles.size + ':' + state.hills.size;
  if (stairCache.ver === v) return stairCache;
  const list = [];
  let n = 0;
  for (const [k, t] of state.tiles) {
    if (!isStair(t)) continue;
    n++;
    const [x, y] = keyXY(k), rot = stairRotOf(t), [dx, dy] = STAIR_UP[rot];
    if (hillLevel(x + dx, y + dy) === hillLevel(x, y) + 1) list.push({ k, x, y, dx, dy, rot });
  }
  stairCache = { ver: v, list, n };
  return stairCache;
}
// [{ k, x, y, dx, dy, rot }] – (dx, dy) zeigt hinauf zur Anhöhe (Spaziergänger, js/hill-walkers.js)
const hillStairs = () => stairFresh().list;
// Höhe (Bildpunkte bei Zoom 1, 0 … HILL_H) auf der Treppe (x, y) am Punkt (u, v) in Feldkoordinaten der Welt (wie px/py der Figuren):
// die Stufe, auf der man dort steht; 0 außerhalb des Felds oder ohne Treppe
function stairHeight(x, y, u, v) {
  const t = stairAt(x, y), a = u - x, b = v - y;
  if (!t || Math.abs(a) > 0.5 || Math.abs(b) > 0.5) return 0;
  const [Du, Dv] = STAIR_UP[stairRotOf(t)], i = Math.min(STAIR_N - 1, Math.max(0, Math.floor((a * Du + b * Dv + 0.5) * STAIR_N)));
  return HILL_H * (i + 1) / STAIR_N;
}
// Treppen um Feld (x, y): foot = die, deren Fuß (Feld davor) (x, y) ist; sonst die, die auf (x, y) hinaufführen. [[x, y], …]
function stairsAround(x, y, foot = false) {
  const out = [];
  for (const [ex, ey] of DIRS) {
    const t = stairAt(x + ex, y + ey);
    if (!t) continue;
    const [dx, dy] = STAIR_UP[stairRotOf(t)];
    if (foot ? dx === ex && dy === ey : dx === -ex && dy === -ey) out.push([x + ex, y + ey]);
  }
  return out;
}
// Richtungen, in die eine Treppe auf (x, y) zeigen kann: dahinter eine Anhöhe genau eine Ebene höher, davor kein Wasser und nichts Höheres
function stairDirs(x, y) {
  const lv = hillLevel(x, y), out = [];
  for (let r = 0; r < 4; r++) {
    const [dx, dy] = STAIR_UP[r];
    if (hillLevel(x + dx, y + dy) === lv + 1 && hillLevel(x - dx, y - dy) <= lv && terrainAt(x - dx, y - dy) !== 'water') out.push(r);
  }
  return out;
}
// Drehung beim Setzen (placeRot, auch Vorschau und Verschieben): zur Anhöhe hin; passen mehrere, die mit einem Weg am Fuß, darunter
// die gewählte (buildRot), sonst die erste. Passt keine: buildRot (die Vorschau zeigt dann rot)
function stairRot(x, y) {
  const ok = stairDirs(x, y);
  if (!ok.length) return buildRot & 3;
  const weg = ok.filter(r => wegAt(x - STAIR_UP[r][0], y - STAIR_UP[r][1]) != null), c = weg.length ? weg : ok;
  return c.includes(buildRot & 3) ? buildRot & 3 : c[0];
}
// Darf hier eine Treppe stehen (placeError, vor den allgemeinen Prüfungen: Belegung, kleine Deko, Gelände)?
function stairError(x, y, rot) {
  if (!ownedTile(x, y)) return notMine(x, y);
  if (hillAt(x, y)) return 'Die Treppe steht unten – direkt vor die Wand einer Anhöhe';
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  if (wegAt(x, y) != null) return 'Nicht auf einen Weg – stell die Treppe ans Ende des Wegs';
  if (state.roofs && state.roofs.size && roofAt(x, y)) return 'Unter einer Überdachung geht keine Treppe';
  const ok = stairDirs(x, y);
  if (!ok.length) return DIRS.some(([dx, dy]) => hillLevel(x + dx, y + dy) > hillLevel(x, y)) ? 'Vor der Treppe braucht es Platz – keine Anhöhe und kein Wasser' : 'Direkt vor die Wand einer Anhöhe stellen – die Treppe führt hinauf';
  if (!ok.includes(rot & 3)) return 'Die Treppe muss zur Anhöhe hinauf zeigen';
  const [dx, dy] = STAIR_UP[rot & 3];
  for (const [nx, ny] of [[x - dx, y - dy], [x + dx, y + dy]]) { const e = state.edges.get(edgeBetween(x, y, nx, ny)); if (e) return `Quer vor der Treppe steht: ${ITEMS[e.b].name} – erst entfernen`; }
  for (const [nx, ny] of [[x - dy, y + dx], [x + dy, y - dx]]) {         // daneben eine Treppe gleicher Richtung: wird breit, also keine Linie dazwischen
    const n = stairAt(nx, ny), e = n && stairRotOf(n) === (rot & 3) && state.edges.get(edgeBetween(x, y, nx, ny));
    if (e) return `Zwischen den Treppen steht: ${ITEMS[e.b].name} – erst entfernen`;
  }
  return null;
}
// Linie k an einer Treppe (edgeError): nicht quer vor den Fuß oder ans obere Ende, nicht mitten durch eine breite Treppe (die Linie
// stünde unten zwischen den Stufen); an die Seite schon
function stairEdgeError(k) {
  const [[ax, ay], [bx, by]] = edgeTiles(k), a = stairAt(ax, ay), b = stairAt(bx, by);
  if (a && b && stairRotOf(a) === stairRotOf(b)) return 'Nicht mitten durch die breite Treppe';
  for (const [t, x, y, ox, oy] of [[a, ax, ay, bx, by], [b, bx, by, ax, ay]]) {
    if (!t) continue;
    const [dx, dy] = STAIR_UP[stairRotOf(t)];
    if (Math.abs(ox - x) === Math.abs(dx) && Math.abs(oy - y) === Math.abs(dy)) return 'Nicht quer vor die Treppe – an ihre Seiten geht es';
  }
  return null;
}
// Wegstil der Stufen: jeder Belag außer Trittsteinen (keine Fläche). Neu gebaut: die Wahl in der Leiste, sonst der Stil des Wegs
const stairStyleOk = id => typeof id === 'string' && isWegStyle(id) && !pathLook(id).stones;
function stairStyleNew() {
  const c = chosenStyle.huegeltreppe;
  if (stairStyleOk(c) && styleOk(styleDef('weg', c))) return c;
  const w = currentStyle('weg');
  return stairStyleOk(w) ? w : roofBelDefault();
}
const stairStyleOf = t => (t && stairStyleOk(t.style) ? t.style : t && t.style == null ? stairStyleNew() : 'sand');
// breite Treppe: diese und alle gleich gerichteten Treppen daneben (quer zur Steigung) – Stil im Fenster für alle
function stairRow(x, y) {
  const t0 = stairAt(x, y);
  if (!t0) return [];
  const rot = stairRotOf(t0), [Du, Dv] = STAIR_UP[rot], out = [[x, y]];
  for (const sg of [1, -1]) for (let i = 1; i < 60; i++) { const nx = x - sg * i * Dv, ny = y + sg * i * Du, t = stairAt(nx, ny); if (!t || stairRotOf(t) !== rot) break; out.push([nx, ny]); }
  return out;
}

// --- Zeichnen ---
// Aussehen aus der Nachbarschaft: je Seite (m = −S, p = +S, S quer zur Steigung) 'h' Anhöhe (ihre Wand ist die Wange), 'j' Nachbartreppe
// gleicher Richtung (Stufen laufen durch), 'k' eigener Keil; kind = Wandart der Anhöhe dahinter
function stairLook(x, y, t) {
  const rot = stairRotOf(t), [Du, Dv] = STAIR_UP[rot], Su = -Dv, Sv = Du, lv = hillLevel(x, y);
  const side = sg => { const nx = x + sg * Su, ny = y + sg * Sv, n = stairAt(nx, ny); return hillLevel(nx, ny) > lv ? 'h' : n && stairRotOf(n) === rot ? 'j' : 'k'; };
  return { rot, style: stairStyleOf(t), kind: hillWall(hillAt(x + Du, y + Dv)), m: side(-1), p: side(1) };
}
// Treppe malen. P(u, v, up) → Bildpunkt (Feldkoordinaten relativ zur Feldmitte, Höhe in Bildpunkten bei Zoom 1); x, y: Feld (Musterraster).
// Von hinten nach vorn: Keil auf der abgewandten Seite, die Stufen (Trittfläche im Wegstil, sichtbare Stirnseite dunkler), Keil vorn
function paintStair(P, o, x, y) {
  const H = HILL_H, n = STAIR_N, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du, S = HILL_STY[o.kind] || HILL_STY.fels;
  const UV = (d, s) => [Du * d + Su * s, Dv * d + Sv * s];               // d längs (hinauf), s quer → (u, v)
  const W = (d, s, h) => P(...UV(d, s), h);
  const toward = Du + Dv > 0, nearP = Su + Sv > 0;                       // steigt zum Betrachter an (Stirnseiten abgewandt); Seite +S liegt vorn
  const lk = lookFar(pathLook(o.style), 1), riser = shade(lk.fill, -0.2);
  const lo = o.m === 'k' ? -0.5 + STAIR_CW : o.m === 'j' ? -0.51 : -0.5, hi = o.p === 'k' ? 0.5 - STAIR_CW : o.p === 'j' ? 0.51 : 0.5;   // zur Nachbartreppe: ohne Fuge
  const line = (a, b, col, w) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'butt'; g.stroke(); };
  const keil = sg => {                                                   // vorn H/n + CAP hoch, hinten H + CAP: immer über den Stufenkanten
    const sOut = 0.5 * sg, sIn = sg * (0.5 - STAIR_CW), hf = H / n + STAIR_CAP, ht = H + STAIR_CAP, outVis = sg * (Su + Sv) > 0;
    const sF = outVis ? sOut : sIn, nu = (outVis ? sg : -sg) * Su;       // sichtbare Seite: außen (vorderer Keil) bzw. innen (hinterer); zeigt nach +u?
    const [a0, b0] = UV(-0.5, sF), [a1, b1] = UV(0.5, sF);
    paintHillWall(P, a0, b0, a1, b1, nu > 0 ? 'u' : 'v', o.kind, 0, hf, x * 5 + y * 9 + 3 * sg + o.rot, ht);
    const end = (d, h, u) => poly([W(d, sIn, 0), W(d, sOut, 0), W(d, sOut, h), W(d, sIn, h)], C(u ? S.u : S.v));
    if (!toward) end(-0.5, hf, -Du > 0); else end(0.5, ht, Du > 0);      // Stirn am Fuß bzw. hinten über der Anhöhe
    poly([W(-0.5, sIn, hf), W(-0.5, sOut, hf), W(0.5, sOut, ht), W(0.5, sIn, ht)], C(S.lip));   // oben Grasnarbe, schräg
  };
  const step = i => {
    const d0 = -0.5 + i / n, d1 = d0 + 1 / n, h = H * (i + 1) / n, hb = H * i / n;
    if (!toward) poly([W(d0, lo, hb), W(d0, hi, hb), W(d0, hi, h), W(d0, lo, h)], C(riser));   // Stirnseite
    const q = [UV(d0, lo), UV(d1, lo), UV(d1, hi), UV(d0, hi)], L = ([u, v]) => P(u, v, h);
    poly(q.map(L), C(lk.fill));
    if (lk.pat) { g.save(); clipTo([q], L); patSeam = true; try { pattern(L, lk.pat[0], x, y, 1, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); } finally { patSeam = false; g.restore(); } }
    if (!toward) line(W(d0, lo, h), W(d0, hi, h), 'rgba(255,255,255,0.35)', 0.7);   // Kante vorn im Licht
    else if (i > 0) line(W(d0, lo, h), W(d0, hi, h), 'rgba(40,30,20,0.28)', 0.9);   // steigt zum Betrachter an: Schattenkante, wo es hinabgeht
  };
  if ((nearP ? o.m : o.p) === 'k') keil(nearP ? -1 : 1);
  for (let j = 0; j < n; j++) step(toward ? j : n - 1 - j);
  if ((nearP ? o.p : o.m) === 'k') keil(nearP ? 1 : -1);
}
const stairSig = o => o.rot + '|' + o.style + '|' + o.kind + '|' + o.m + o.p;
// drawObject 'huegeltreppe' (draw-objects.js): als Bildchen je Feld (wie drawHillTile, mit Zeitbudget beim Zoomen). Steht die Treppe so
// nicht auf dem Feld (Vorschau beim Bauen/Verschieben): ein eigenes Bildchen 'sg' mit dem Feld im Schlüssel (Muster im Weltraster).
// t kann eine Kopie sein (spriteTile malt mit einer) – verglichen wird der Inhalt, nicht das Ding
function drawHillStair(cx, cy, z, x, y, t) {
  t = t || stairAt(x, y);
  if (!t) return;
  const on = stairAt(x, y), real = !!on && stairRotOf(on) === stairRotOf(t) && on.style === t.style, key = real ? 's' + x + ',' + y : 'sg';
  const want = DPR * Math.pow(2, Math.ceil(Math.log2(Math.max(z, 0.2)) * 2 - 1e-9) / 2);
  let e = hillSprites.get(key);
  // Aussehen nur neu bestimmen, wenn sich am Spielstand etwas getan hat (Stil im Fenster: groundVersion++)
  const ver = groundVersion + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + (state.hills ? state.hills.size : 0) + ':' + state.tiles.size + (FOG ? 'n' : '') + '|' + stairRotOf(t) + t.style;
  const fresh = real && e && e.ver === ver, o = fresh ? e.o : stairLook(x, y, t);
  const base = fresh ? e.base : stairSig(o) + (real ? '' : '|' + x + ',' + y) + (FOG ? 'n' : ''), sig = base + '|' + want.toFixed(3);
  if (e && e.base === base) { e.ver = ver; e.o = o; }
  if (hillPaintFrame !== frameNo) { hillPaintFrame = frameNo; hillPaintMs = 0; }
  if (!e || (e.sig !== sig && !(e.base === base && hillPaintMs > HILL_BUDGET))) {
    hillPurge();
    const t0 = performance.now(), B = HILL_BOX, c = document.createElement('canvas');
    c.width = Math.ceil(B.w * want); c.height = Math.ceil(B.h * want);
    const cg = c.getContext('2d');
    if (!cg) return;
    const prev = g; g = cg;
    try { g.setTransform(want, 0, 0, want, -B.left * want, -B.top * want); paintStair((u, v, up = 0) => [(u - v) * TW / 2, (u + v) * TH / 2 - up], o, x, y); } finally { g = prev; }
    if (e) freeCanvas(e.c);
    e = { c, sig, base, ver, o };
    hillSprites.set(key, e);
    hillPaintMs += performance.now() - t0;
  }
  const B = HILL_BOX;
  g.drawImage(e.c, cx + B.left * z, cy + B.top * z, B.w * z, B.h * z);
}
// Für Figuren auf der Treppe (Spaziergänger, nach der Figur aufrufen): was auf dem Treppenfeld vor einer Figur an der Stelle d (−½ Fuß … ½
// oben) liegt, aus dem Bildchen noch einmal darüber – der vordere Keil und, steigt die Treppe zum Betrachter an, die höheren Stufen davor.
// Nachbarfelder (Anhöhe vorn, breite Treppe) zeichnen sich danach ohnehin selbst
function drawHillStairOver(x, y, z, d) {
  const e = stairAt(x, y) && hillSprites.get('s' + x + ',' + y), o = e && e.o;
  if (!o) return;
  const H = HILL_H, n = STAIR_N, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du, nearP = Su + Sv > 0, c = toScreen(x, y);
  const W = (dd, s, h) => { const u = Du * dd + Su * s, v = Dv * dd + Sv * s; return [c.x + (u - v) * TW / 2 * z, c.y + (u + v) * TH / 2 * z - h * z]; };
  const add = pts => {                                                   // gleicher Drehsinn für alle (sonst heben sich Überlappungen auf)
    let a = 0;
    for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[(k + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    const list = a < 0 ? [...pts].reverse() : pts;
    list.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
  };
  let any = false;
  g.save(); g.beginPath();
  if ((nearP ? o.p : o.m) === 'k') {
    const sg = nearP ? 1 : -1, sO = 0.5 * sg, sI = sg * (0.5 - STAIR_CW), hf = H / n + STAIR_CAP, ht = H + STAIR_CAP;
    add(hull([[-0.5, 0], [-0.5, hf], [0.5, 0], [0.5, ht]].flatMap(([dd, h]) => [W(dd, sO, h), W(dd, sI, h)]))); any = true;
  }
  if (Du + Dv > 0) {
    const lo = o.m === 'k' ? -0.5 + STAIR_CW : -0.5, hi = o.p === 'k' ? 0.5 - STAIR_CW : 0.5;
    for (let j = Math.max(0, Math.floor((d + 0.5) * n) + 1); j < n; j++) { const d0 = -0.5 + j / n, d1 = d0 + 1 / n, h = H * (j + 1) / n; add([W(d0, lo, h), W(d1, lo, h), W(d1, hi, h), W(d0, hi, h)]); any = true; }
  }
  try { if (any) { g.clip('nonzero'); const B = HILL_BOX; g.drawImage(e.c, c.x + B.left * z, c.y + B.top * z, B.w * z, B.h * z); } } finally { g.restore(); }
}
// Vorschaubild (Leiste, Bau-Infofenster): ein Eck Anhöhe (Felswand), rechts davor die eingelassene Treppe mit Keil
function drawStairIcon(cx, cy, z, style) {
  const k = z * 0.56, H = HILL_H, P = (u, v, up = 0) => [cx + (u - v) * TW / 2 * k, cy + (u + v + 0.5) * TH / 2 * k - (up - H * 0.45) * k];
  const top = (u, v) => poly([P(u - 0.5, v - 0.5, H), P(u + 0.5, v - 0.5, H), P(u + 0.5, v + 0.5, H), P(u - 0.5, v + 0.5, H)], C('#a2d879'));
  const at = (u, v) => (a, b, h) => P(u + a, v + b, h);
  top(-1, -1);
  top(0, -1); paintHillWall(at(0, -1), 0.5, -0.5, 0.5, 0.5, 'u', 'fels', 0, H, 3);
  top(-1, 0); paintHillWall(at(-1, 0), 0.5, -0.5, 0.5, 0.5, 'u', 'fels', 0, H, 5); paintHillWall(at(-1, 0), -0.5, 0.5, 0.5, 0.5, 'v', 'fels', 0, H, 7);
  paintStair(at(0, 0), { rot: 0, style: stairStyleOk(style) ? style : 'sand', kind: 'fels', m: 'h', p: 'k' }, 1e6, 1e6);
}
