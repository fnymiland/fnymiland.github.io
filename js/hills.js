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
  hillTake(x, y);
  addFloat(x, y, '+' + fmt(ITEMS.anhoehe.cost), '#3f8f43');
  sfx('dig'); recalc(); save();
  return true;
}
// Anhöhe vom Feld nehmen und voll erstatten (lowerHill, Treppe in die Anhöhe)
function hillTake(x, y) {
  const k = x + ',' + y;
  state.hills.delete(k);
  const e = hillSprites.get(k);                                          // Bildchen gleich freigeben
  if (e) { freeCanvas(e.c); hillSprites.delete(k); }
  state.money += ITEMS.anhoehe.cost;
  for (const [r, n] of Object.entries(ITEMS.anhoehe.mat || {})) state.res[r] += n;
  groundVersion++;
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
// Vorschau „Treppe in die Anhöhe“ (render.js, nur für dieses Bild): { k, x, y, rot, lv } – das Feld zeichnet sich eine Ebene tiefer mit
// der Treppe (rot), seine Nachbarn als eigene Bildchen (drawHillTile 'p' + Feld), die echten bleiben. Spielregeln fragen es nie
let hillGap = null;
const drawLevel = (x, y) => hillGap && hillGap.x === x && hillGap.y === y ? hillGap.lv : hillLevel(x, y);
// Wand ein Stück unter das später gezeichnete Bildchen des Nachbarn verlängern (Nutzer: bündig – sonst schimmert an der Fuge zweier
// Wandbildchen der Boden durch beide geglätteten Kanten: grünlicher Strich). Nur wo der Nachbar es ganz deckt: gerade weiter (seine Wand
// gleich hoch) oder Innenecke (Anhöhe davor); nie an Außenecken und nicht an Treppen. [vorn +y, rechts +x]
const HILL_EXT = 0.0075;
function hillExt(x, y, lv, st) {
  const ok = (nx, ny, fx, fy, c) => drawLevel(nx, ny) === lv && (drawLevel(fx, fy) === drawLevel(fx - (nx - x), fy - (ny - y)) || drawLevel(fx, fy) >= lv)
    && !st.includes(c) && !hillStairEnds(nx, ny).includes(c);
  return [lv > drawLevel(x, y + 1) && ok(x + 1, y, x + 1, y + 1, 'v') ? HILL_EXT : 0, lv > drawLevel(x + 1, y) && ok(x, y + 1, x + 1, y + 1, 'u') ? HILL_EXT : 0];
}
function hillSig(x, y, h) {
  const lv = h.h || 1, wu = lv - drawLevel(x + 1, y), wv = lv - drawLevel(x, y + 1);
  let s = (h.w || 0) + ':' + wu + ':' + wv + ':' + (drawLevel(x - 1, y) < lv ? 1 : 0) + (drawLevel(x, y - 1) < lv ? 1 : 0) + ':' + terrainAt(x, y) + ':' + (terraLook(x, y) || '') + ':' + (COVER.has(x + ',' + y) ? 1 : 0) + ':' + (isBeach(x, y) ? 1 : 0);
  if (terraLook(x, y) === 'park' || terraLook(x, y) === 'fz') {          // Parkrand (drawGround): Nachbarn und ☰ „Ränder aus“
    s += state.noBorders ? 'r' : '';
    for (const [dx, dy] of DIRS) s += terraLook(x + dx, y + dy) === terraLook(x, y) ? 1 : 0;
  }
  const st = hillStairEnds(x, y);                                        // Treppe (Block 157d): dort keine Grasnarbe bzw. keine Kante
  if (st) s += ':t' + st;
  if (hillMiter(x, y, lv)) s += ':m';
  const ex = hillExt(x, y, lv, st || '');
  if (ex[0] || ex[1]) s += ':e' + (ex[0] ? 1 : 0) + (ex[1] ? 1 : 0);
  return s;
}
// Treppen, die auf Feld (x, y) hinaufführen, als Zeichen je Seite: v/u = vorn (+y/+x, Wand ohne Grasnarbe – die Stufen decken sie),
// U/V = hinten (−x/−y, keine dunkle Kante oben – die oberste Stufe schließt bündig an). Treppen hinten daneben (Feld ist ihre Wange, oberste
// Stufe so hoch wie die Oberseite): a/b = bei −x, oberste Stufe bei −y/+y; c/d = bei −y, oberste Stufe bei −x/+x. '' = keine
function hillStairEnds(x, y) {
  if (!stairFresh().n && !hillGap) return '';
  let s = '';
  for (const [c, r, dx, dy] of [['v', 0, 0, 1], ['u', 3, 1, 0], ['U', 1, -1, 0], ['V', 2, 0, -1], ['a', 0, -1, 0], ['b', 2, -1, 0], ['c', 3, 0, -1], ['d', 1, 0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (stairRotAt(nx, ny) === r && (!'abcd'.includes(c) || drawLevel(nx, ny) + 1 === hillLevel(x, y))) s += c;
  }
  return s;
}
// Drehung der Treppe auf (x, y), auch der Vorschau „Treppe in die Anhöhe“ (hillGap); −1 = keine
const stairRotAt = (x, y) => { const t = stairAt(x, y); return t ? stairRotOf(t) : hillGap && hillGap.x === x && hillGap.y === y ? hillGap.rot : -1; };
// Innenecke hinten: enden an der hinteren Ecke von (x, y) die dunklen Kanten oben von links (−y-Kante von x − 1, y bzw. der hintere Keil
// einer Treppe dort hinauf) und von rechts (−x-Kante von x, y − 1 bzw. Keil) – Anhöhe in L-Form, Treppe an der Kante. Dann schließt
// (x, y) ihre Gehrung (paintHill), sonst bliebe zwischen ihnen eine helle Kerbe
function hillMiter(x, y, lv) {
  const cl = drawLevel(x - 1, y - 1);
  if (cl >= lv) return false;
  const arm = (ax, ay, r, cut) => {                                      // r: Treppe dort hinauf zu (x, y); cut: Zeichen, mit denen die Kante vor der Ecke endet
    if (hillAt(ax, ay) && drawLevel(ax, ay) === lv) { const st = hillStairEnds(ax, ay); return !cut.some(c => st.includes(c)); }
    return stairRotAt(ax, ay) === r && drawLevel(ax, ay) + 1 === lv && cl <= drawLevel(ax, ay) && stairRotAt(x - 1, y - 1) !== r;   // dort ein Keil
  };
  return arm(x - 1, y, 1, ['V', 'd']) && arm(x, y - 1, 2, ['U', 'b']);
}
// eine Wand von (a0, b0) nach (a1, b1) (Feldkoordinaten relativ zum Feld), Höhe hb..ht, nach +x ('u') bzw. +y ('v'). ht1: Höhe am Ende
// (Keil der Treppe, Block 157d: oben schräg; sonst = ht), lip false: ohne Grasnarbe, knee: ab da oben waagerecht auf ht1 (Keil: oberste Stufe).
// Grasnarbe und Schichten treffen an den Enden genau ihre Mitte – so laufen sie über Feldgrenzen und um Ecken bündig weiter (Nachbarwand,
// Keil, Stirn); dazwischen wellig wie bisher. Die Grasnarbe reicht nie unter den Fuß der Wand.
// e0/e1: Stück über Anfang/Ende hinaus (Anteil der Wand) – nur unter ein später gezeichnetes Bildchen, das es ganz deckt (Nachbarwand
// geradeaus, Innenecke, Keil ↔ Anhöhe). Sonst schimmert an der Fuge der Boden durch beide geglätteten Kanten (grünlicher Strich).
// Dort Höhe wie am Ende, Schichten waagerecht weiter, die Grasnarbe läuft auf die Oberkante aus (an Innenecken stünde sie sonst über)
function paintHillWall(P, a0, b0, a1, b1, dir, kind, hb, ht, seed, ht1 = ht, lip = true, knee = 1, e0 = 0, e1 = 0) {
  const S = HILL_STY[kind], at = (s, h) => P(a0 + (a1 - a0) * s, b0 + (b1 - b0) * s, h), H = Math.max(ht, ht1) - hb, top = s => ht + (ht1 - ht) * Math.min(1, Math.max(0, s) / knee);
  const quad = [at(-e0, hb), at(1 + e1, hb)];
  if (e1) quad.push(at(1 + e1, ht1));
  quad.push(at(1, ht1));
  if (knee < 1) quad.push(at(knee, ht1));
  quad.push(at(0, ht));
  if (e0) quad.push(at(-e0, ht));
  poly(quad, C(dir === 'u' ? S.u : S.v));
  g.save(); g.beginPath(); quad.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
  const line = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); };
  const r = i => hash(seed, i, 157);
  if (kind === 'fels') {                                                 // Schichten und Risse
    for (let k = 1; k < 5; k++) {
      const pts = [], h = hb + k * H / 5;
      if (e0) pts.push(at(-e0, h));
      for (let i = 0; i <= 6; i++) pts.push(at(i / 6, h + (i % 6 ? r(k * 7 + i) - 0.5 : 0) * 3));
      if (e1) pts.push(at(1 + e1, h));
      line(pts, S.line, 0.9);
    }
    for (let c = 0; c < 3; c++) { const s = 0.18 + 0.3 * c + r(50 + c) * 0.1; line([at(s, hb + H * 0.85), at(s + 0.05, hb + H * 0.55), at(s - 0.02, hb + H * 0.3)], S.line, 0.8); }
  } else if (kind === 'erde') {                                          // Wurzeln und Steinchen
    for (let c = 0; c < 4; c++) { const s = 0.15 + 0.22 * c; line([at(s, top(s) - 3), at(s + 0.03, top(s) - 8 - r(60 + c) * 6)], 'rgba(70,45,25,0.5)', 0.7); }
    for (let c = 0; c < 6; c++) { const p = at(r(70 + c) * 0.9 + 0.05, hb + 3 + r(80 + c) * (H - 10)); g.beginPath(); g.ellipse(p[0], p[1], 1.6, 1.1, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(200,185,160,0.8)'; g.fill(); }
  } else {                                                               // Trockenmauer: Steine im Verband
    const rows = 5, n = 4;
    for (let k = 0; k < rows; k++) {
      const h0 = hb + k * H / rows, h1 = hb + (k + 1) * H / rows, off = k % 2 ? 0.5 / n : 0;
      line([at(-e0, h1), at(1 + e1, h1)], S.line, 0.9);
      for (let i = 0; i <= n; i++) { const s = i / n + off; if (s > 0 && s < 1) line([at(s, h0), at(s, h1)], S.line, 0.9); }
    }
  }
  g.restore();
  if (!lip) return;
  const pts = [];                                                        // Grasnarbe oben (wellig)
  if (e0) pts.push(at(-e0, top(0)));
  for (let i = 0; i <= 8; i++) pts.push(at(i / 8, top(i / 8) + 0.4));
  const low = i => { const b = top(i / 8) - S.lipH - (i % 8 ? r(90 + i) : 0.5) * S.lipH * 0.7; return b - hb < S.lipH ? hb : b; };   // bliebe darunter kaum Wand (Keil vorn), reicht sie bis zum Fuß – keine Zacken
  if (e1) pts.push(at(1 + e1, top(1)), at(1 + e1, low(8)));
  for (let i = 8; i >= 0; i--) pts.push(at(i / 8, low(i)));
  if (e0) pts.push(at(-e0, low(0)));
  poly(pts, C(S.lip));
}
function paintHill(x, y, h) {
  const lv = h.h || 1, top = lv * HILL_H, kind = hillWall(h), st = hillStairEnds(x, y);
  const P = (u, v, up = 0) => [(u - v) * TW / 2, (u + v) * TH / 2 - up];   // relativ zur Feldmitte
  // Oberseite: der Boden, angehoben – zugeschnitten auf ihre Raute: drawGround malt darunter die Seiten des Bodens (Brauntöne, 0,5 Punkte
  // breiter als das Feld), die sonst an jeder Feldgrenze als feine Striche in der Grasnarbe der Wand standen. Nach vorn (+x, +y) ein wenig
  // größer, wo dort Anhöhe gleicher Höhe anschließt (das später gezeichnete Nachbarfeld deckt es, keine Fuge); nach hinten und über einer
  // Wand genau – sonst stünde an Ecken und Feldgrenzen eine Spitze über die Grasnarbe (Nutzer: bündig)
  const wv = lv - drawLevel(x, y + 1), wu = lv - drawLevel(x + 1, y), fu = wu > 0 ? 0 : 0.0075, fv = wv > 0 ? 0 : 0.0075;
  const T = P(-0.5, -0.5, top), R = P(0.5 + fu, -0.5, top), B = P(0.5 + fu, 0.5 + fv, top), L = P(-0.5, 0.5 + fv, top);
  const clip = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip(); };
  g.save(); clip([T, R, B, L]);
  try { drawGround(x, y, { x: 0, y: -top }, 1, 0, true); } finally { g.restore(); }
  // Kante oben zur tieferen Seite hinten (Nutzer: Oberseite hob sich hinten nicht von der Wiese ab) – wie im Konzeptbild, 1,5 breit innen an
  // der Kante. Zugeschnitten wie die Oberseite: an Feldgrenzen schließt sie bündig an die des Nachbarn an, an Ecken steht nichts über;
  // treffen sich beide hinten an der Ecke, je eine Hälfte der Raute (auf Gehrung, nie doppelt dunkel). Neben einer Treppe (a/b, c/d) endet
  // sie an der obersten Stufe – dort liegen Stufe und Oberseite gleich hoch
  const bu = drawLevel(x - 1, y) < lv && !st.includes('U'), bv = drawLevel(x, y - 1) < lv && !st.includes('V');
  const both = bu && bv && !st.includes('a') && !st.includes('c'), n1 = 1 / STAIR_N;
  g.strokeStyle = 'rgba(45,85,30,0.5)'; g.lineWidth = 1.5; g.lineCap = 'butt';
  for (const [on, half, at, s0, s1] of [
    [bu, [T, B, L], (s, w) => P(-0.5 + w, s, top), st.includes('a') ? -0.5 + n1 : -1, st.includes('b') ? 0.5 - n1 : 1],   // −x: s längs v
    [bv, [T, R, B], (s, w) => P(s, -0.5 + w, top), st.includes('c') ? -0.5 + n1 : -1, st.includes('d') ? 0.5 - n1 : 1],   // −y: s längs u
  ]) {
    if (!on) continue;
    g.save();
    try {
      clip(both ? half : [T, R, B, L]);
      if (s0 > -1 || s1 < 1) clip([at(s0, -1), at(s0, 2), at(s1, 2), at(s1, -1)]);
      const p = at(-0.6, 0), q = at(0.6, 0);
      g.beginPath(); g.moveTo(p[0], p[1] + 0.84); g.lineTo(q[0], q[1] + 0.84); g.stroke();
    } finally { g.restore(); }
  }
  if (hillMiter(x, y, lv)) {                                             // Innenecke hinten: die Gehrung der Kanten von links und rechts
    g.save();
    try {
      clip([T, R, B, L]);
      const a = P(-0.5, -0.6, top), b = P(-0.5, 0.6, top);
      clip([a, b, [b[0], b[1] + 1.68], [a[0], a[1] + 1.68]]);              // Streifen längs −x …
      const p = P(-0.6, -0.5, top), q = P(0.6, -0.5, top);
      g.beginPath(); g.moveTo(p[0], p[1] + 0.84); g.lineTo(q[0], q[1] + 0.84); g.stroke();   // … mit dem längs −y
    } finally { g.restore(); }
  }
  const [ev, eu] = hillExt(x, y, lv, st);
  if (wv > 0) paintHillWall(P, -0.5, 0.5, 0.5, 0.5, 'v', kind, top - wv * HILL_H, top, x * 7 + y * 13, top, !st.includes('v'), 1, 0, ev);
  if (wu > 0) paintHillWall(P, 0.5, -0.5, 0.5, 0.5, 'u', kind, top - wu * HILL_H, top, x * 11 + y * 5 + 3, top, !st.includes('u'), 1, 0, eu);
}
function drawHillTile(x, y, px, py, z) {
  const h = hillAt(x, y);
  if (!h) return;
  const gap = hillGap && Math.abs(hillGap.x - x) + Math.abs(hillGap.y - y) === 1;   // Nachbar der Vorschau „Treppe in die Anhöhe“: eigenes Bildchen
  const want = DPR * Math.pow(2, Math.ceil(Math.log2(Math.max(z, 0.2)) * 2 - 1e-9) / 2), key = (gap ? 'p' : '') + x + ',' + y;
  let e = hillSprites.get(key);
  // Schlüssel nur neu rechnen, wenn sich am Spielstand etwas getan hat (wie die Dächer); nach dem Zoomen im Zeitbudget neu malen
  const ver = groundVersion + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + state.hills.size + (FOG ? 'n' : '') + (gap ? '|' + hillGap.k + ':' + hillGap.rot : '');
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
    const [Du, Dv] = STAIR_UP[stairRotOf(t)], H = HILL_H, P = (u, v, up) => { const p = iso(x + u, y + v); return [p.x + SUN.dx * up, p.y + SUN.dy * up]; };
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
const STAIR_N = 8, STAIR_CW = 0.1;                                       // Stufen je Feld; Keil: Breite (Feld)
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
  let n = 0, ecken = 0;
  for (const [k, t] of state.tiles) {
    if (!isStair(t)) continue;
    n++;
    if (t.ecke) { ecken++; continue; }                                    // Ecktreppe: kein Aufgang für Spaziergänger (führt schräg)
    const [x, y] = keyXY(k), rot = stairRotOf(t), [dx, dy] = STAIR_UP[rot];
    if (hillLevel(x + dx, y + dy) === hillLevel(x, y) + 1) list.push({ k, x, y, dx, dy, rot });
  }
  stairCache = { ver: v, list, n, ecken };
  return stairCache;
}
// [{ k, x, y, dx, dy, rot }] – (dx, dy) zeigt hinauf zur Anhöhe (Spaziergänger, js/hill-walkers.js)
const hillStairs = () => stairFresh().list;
// Höhe (Bildpunkte bei Zoom 1, 0 … HILL_H) auf der Treppe (x, y) am Punkt (u, v) in Feldkoordinaten der Welt (wie px/py der Figuren):
// die Stufe, auf der man dort steht; 0 außerhalb des Felds oder ohne Treppe
function stairHeight(x, y, u, v) {
  const t = stairAt(x, y), a = u - x, b = v - y;
  if (!t || Math.abs(a) > 0.5 || Math.abs(b) > 0.5) return 0;
  const idx = ([Du, Dv]) => Math.min(STAIR_N - 1, Math.max(0, Math.floor((a * Du + b * Dv + 0.5) * STAIR_N)));
  const i = t.ecke ? Math.min(...cornerAxes(stairRotOf(t)).map(idx)) : idx(STAIR_UP[stairRotOf(t)]);   // Ecke: L-förmig
  return HILL_H * (i + 1) / STAIR_N;
}
// Treppen um Feld (x, y): foot = die, deren Fuß (Feld davor) (x, y) ist; sonst die, die auf (x, y) hinaufführen. [[x, y], …]
function stairsAround(x, y, foot = false) {
  const out = [];
  for (const [ex, ey] of DIRS) {
    const t = stairAt(x + ex, y + ey);
    if (!t || t.ecke) continue;
    const [dx, dy] = STAIR_UP[stairRotOf(t)];
    if (foot ? dx === ex && dy === ey : dx === -ex && dy === -ey) out.push([x + ex, y + ey]);
  }
  // Ecktreppen ringsum: führen schräg hinauf auf die Ecke (n + D1 + D2), ihre Füße sind die beiden äußeren Seiten (n − D1, n − D2)
  if (stairFresh().ecken) for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) {
    const nx = x + ex, ny = y + ey, t = (ex || ey) && stairAt(nx, ny);
    if (!t || !t.ecke) continue;
    const [D1, D2] = cornerAxes(stairRotOf(t));
    if (foot ? (nx - D1[0] === x && ny - D1[1] === y) || (nx - D2[0] === x && ny - D2[1] === y) : nx + D1[0] + D2[0] === x && ny + D1[1] + D2[1] === y) out.push([nx, ny]);
  }
  return out;
}
// Ecktreppe (Nutzer, 10.10.2026: „Treppen sollten auch um die Ecke gehen dürfen – ein erhöhter Platz, der aus allen Richtungen begangen
// werden kann“): das Feld schräg vor der Ecke einer Anhöhe, an den beiden Seiten zur Ecke hin je eine Treppe, die um diese Ecke hinaufführt.
// Drehung r: Seiten D1 = STAIR_UP[r], D2 = STAIR_UP[r + 1]; die Ecke der Anhöhe liegt bei D1 + D2. Stufen L-förmig (wie eine Stufenpyramide):
// Stufe = kleinere der beiden Stufen längs D1 und D2 – an der Grenze zur Nachbartreppe genau deren Stufen, ohne Fuge
// wird eine neue Treppe auf (x, y) eine Ecktreppe? (keine gerade Richtung, aber eine Ecke; build, Vorschau)
const stairCornerNew = (x, y) => !stairDirs(x, y, stairBase(x, y)).length && cornerDirs(x, y).length > 0;
const cornerAxes = r => [STAIR_UP[r & 3], STAIR_UP[(r + 1) & 3]];
function cornerDirs(x, y, lv = stairBase(x, y)) {
  const out = [];
  for (let r = 0; r < 4; r++) {
    const [[ax, ay], [bx, by]] = cornerAxes(r), s1 = stairAt(x + ax, y + ay), s2 = stairAt(x + bx, y + by);
    if (hillLevel(x + ax + bx, y + ay + by) === lv + 1 && s1 && !s1.ecke && stairRotOf(s1) === ((r + 1) & 3) && s2 && !s2.ecke && stairRotOf(s2) === r
      && hillLevel(x + ax, y + ay) === lv && hillLevel(x + bx, y + by) === lv) out.push(r);
  }
  return out;
}
// Treppen ausrichten (Nutzer, 10.10.2026: „was ist, wenn da schon so etwas steht – erst die Teile entfernen und neu bauen ist umständlich“):
// Wie soll die Treppe auf (x, y) liegen? Ecke, wenn es eine Ecke ist; sonst gerade – die eigene Richtung, solange sie passt, sonst die beste
// (stairRot). null = passt nirgends hin
function stairFit(x, y) {
  const t = stairAt(x, y);
  if (!t) return null;
  const lv = hillLevel(x, y), cd = cornerDirs(x, y, lv);
  if (cd.length) return { ecke: true, rot: t.ecke && cd.includes(stairRotOf(t)) ? stairRotOf(t) : cd[0] };
  const ok = stairDirs(x, y, lv);
  if (!ok.length) return null;
  return { ecke: false, rot: !t.ecke && ok.includes(stairRotOf(t)) ? stairRotOf(t) : stairRot(x, y) };
}
// Treppen um (x, y) (5 × 5) neu ausrichten, bis nichts mehr wechselt (Ecken hängen an geraden Nachbarn). dry: nur zählen, danach wie vorher.
// Liefert die Zahl der umgestellten Treppen
function refitStairs(x, y, dry = false) {
  const before = new Map();
  let n = 0;
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const t = stairAt(x + dx, y + dy), f = t && stairFit(x + dx, y + dy);
      if (!f || (f.ecke === !!t.ecke && f.rot === stairRotOf(t))) continue;
      const k = (x + dx) + ',' + (y + dy);
      if (!before.has(k)) { before.set(k, { rot: t.rot, ecke: t.ecke }); n++; }
      t.rot = f.rot; if (f.ecke) t.ecke = true; else delete t.ecke;
      changed = true;
    }
    if (!changed) break;
  }
  if (dry) for (const [k, o] of before) { const t = state.tiles.get(k); t.rot = o.rot; if (o.ecke) t.ecke = true; else delete t.ecke; }
  else if (n) groundVersion++;
  return n;
}
// Treppe auf eine Treppe gesetzt: nur ausrichten (kostenlos) – geht, wenn sich dabei etwas ändert
const stairRefitError = (x, y) => refitStairs(x, y, true) ? null : 'Hier steht schon eine Treppe, die passt';
// Feld (x, y) wird zur Treppe eingesetzt, obwohl schon Treppen hinaufführen: geht, wenn die sich danach neu ausrichten lassen (z. B. als Ecke).
// Probehalber: Anhöhe weg, Treppe hin, ausrichten, prüfen – danach alles wie vorher
function stairIntoRefits(x, y) {
  const k = x + ',' + y, h = state.hills.get(k), old = state.tiles.get(k);
  if (old) return false;
  const tmp = { b: 'huegeltreppe', lvl: 1, rot: 0 };
  state.hills.delete(k); state.tiles.set(k, tmp);
  const saved = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const t = stairAt(x + dx, y + dy); if (t && t !== tmp) saved.push([t, t.rot, t.ecke, x + dx, y + dy]); }
  try {
    tmp.rot = stairRot(x, y);
    refitStairs(x, y);
    return !!stairFit(x, y) && saved.every(([, , , tx, ty]) => !!stairFit(tx, ty));
  } finally {
    for (const [t, r, e] of saved) { t.rot = r; if (e) t.ecke = true; else delete t.ecke; }
    state.tiles.delete(k); state.hills.set(k, h);
  }
}
// Ecktreppe neben (x, y), die an dieser Treppe hängt (Abreißen, Aufnehmen sperren)
function cornerOn(x, y) {
  if (!stairFresh().ecken) return null;
  for (const [ex, ey] of DIRS) {
    const t = stairAt(x + ex, y + ey);
    if (!t || !t.ecke) continue;
    const [D1, D2] = cornerAxes(stairRotOf(t));
    if ((x + ex + D1[0] === x && y + ey + D1[1] === y) || (x + ex + D2[0] === x && y + ey + D2[1] === y)) return [x + ex, y + ey];
  }
  return null;
}
// Richtungen, in die eine Treppe auf (x, y) zeigen kann: dahinter eine Anhöhe genau eine Ebene höher, davor kein Wasser und nichts Höheres.
// lv: Ebene, auf der die Treppe steht (stairBase: in eine Anhöhe eingelassen eine tiefer)
function stairDirs(x, y, lv = hillLevel(x, y)) {
  const out = [];
  for (let r = 0; r < 4; r++) {
    const [dx, dy] = STAIR_UP[r];
    if (hillLevel(x + dx, y + dy) === lv + 1 && hillLevel(x - dx, y - dy) <= lv && terrainAt(x - dx, y - dy) !== 'water') out.push(r);
  }
  return out;
}
// Drehung beim Setzen (placeRot, auch Vorschau und Verschieben): zur Anhöhe hin; passen mehrere, die mit einem Weg am Fuß, darunter
// die gewählte (buildRot), sonst die erste. Passt keine: buildRot (die Vorschau zeigt dann rot)
function stairRot(x, y) {
  const ok = stairDirs(x, y, stairBase(x, y));
  if (!ok.length) { const cd = cornerDirs(x, y); return cd.length ? cd[0] : buildRot & 3; }   // Ecktreppe
  // Punkte: Weg am Fuß, ein echter Fuß (keine Treppe – sonst dreht sich eine am Rand eingesetzte längs zur Nachbartreppe), eine Treppe gleicher
  // Richtung daneben (wird breit); bei Gleichstand die gewählte Drehung, sonst die erste
  const score = r => {
    const [dx, dy] = STAIR_UP[r], fx = x - dx, fy = y - dy;
    const side = [[x - dy, y + dx], [x + dy, y - dx]].some(([nx, ny]) => { const n = stairAt(nx, ny); return n && !n.ecke && stairRotOf(n) === r; });
    return (wegAt(fx, fy) != null ? 4 : 0) + (stairAt(fx, fy) ? 0 : 2) + (side ? 1 : 0);
  };
  const best = Math.max(...ok.map(score)), c = ok.filter(r => score(r) === best);
  return c.includes(buildRot & 3) ? buildRot & 3 : c[0];
}
// Darf hier eine Treppe stehen (placeError, vor den allgemeinen Prüfungen: Belegung, kleine Deko, Gelände)? move: getragen (✋, Kopie)
function stairError(x, y, rot, move) {
  if (!ownedTile(x, y)) return notMine(x, y);
  const into = !!hillAt(x, y);
  if (into) { const e = stairIntoError(x, y, move); if (e) return e; }
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  if (wegAt(x, y) != null) return 'Nicht auf einen Weg – stell die Treppe ans Ende des Wegs';
  if (state.roofs && state.roofs.size && roofAt(x, y)) return 'Unter einer Überdachung geht keine Treppe';
  const ok = stairDirs(x, y, stairBase(x, y)), cd = ok.length ? [] : cornerDirs(x, y);
  if (cd.length) {                                                       // Ecktreppe zwischen zwei Treppen um die Ecke
    if (!cd.includes(rot & 3)) return 'Die Ecktreppe muss in die Ecke der Anhöhe zeigen';
    for (const [ex, ey] of DIRS) { const e = state.edges.get(edgeBetween(x, y, x + ex, y + ey)); if (e) return `An der Ecktreppe steht: ${ITEMS[e.b].name} – erst entfernen`; }
    return null;
  }
  if (!ok.length && into) {                                              // Randfeld, aber kein Fuß: davor Wasser, oder dahinter keine Anhöhe
    const lv = hillLevel(x, y), wet = DIRS.some(([dx, dy]) => hillLevel(x + dx, y + dy) === lv && hillLevel(x - dx, y - dy) < lv);
    return wet ? 'Vor der Treppe braucht es Platz – kein Wasser' : 'Hinter der Treppe muss Anhöhe bleiben – hier ist sie zu schmal';
  }
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
// Treppe in eine bestehende Anhöhe (Nutzer, 10.10.2026: „nicht erst ranbauen und dann links rechts eine Anhöhe drumrum, sondern auch
// überschreiben“): auf ein Randfeld der Anhöhe getippt, wird das Feld abgesenkt (hillTake: Erstattung wie lowerHill, mit dem Treppenpreis
// verrechnet) und die Treppe steht dort – Fuß-Bedingungen wie unten (stairDirs eine Ebene tiefer), Drehung über stairRot. Ein Schritt
// für ↶ (Feld und Anhöhe zusammen). Getragen (✋ Verschieben, Gruppen, ⧉ Kopien) nicht: Ablegen senkt nie Gelände ab und erstattet nichts
// – Abreißen gibt alles zurück, dort neu bauen kostet also nicht mehr
const stairBase = (x, y) => hillAt(x, y) ? hillLevel(x, y) - 1 : hillLevel(x, y);   // Ebene, auf der eine Treppe hier stünde
const stairIntoBack = (x, y) => hillAt(x, y) ? ITEMS.anhoehe.cost : 0;   // Erstattung fürs Absenken (Preisprüfung, Schild, build)
function stairIntoError(x, y, move) {
  if (move) return 'Nur vor die Wand – in die Anhöhe die Treppe neu bauen';
  const lv = hillLevel(x, y);
  if (lv !== 1) return 'Die Treppe führt nur auf die erste Ebene';
  if (DIRS.every(([dx, dy]) => hillLevel(x + dx, y + dy) >= lv)) return 'Die Treppe gehört an den Rand der Anhöhe';
  if (stairsAround(x, y).length && !stairIntoRefits(x, y)) return 'Hierher führt schon eine Treppe hinauf';   // sie führte sonst ins Leere – außer sie richtet sich neu aus (z. B. als Ecke)
  const t = objAt(x, y), d = (decosAt(x + ',' + y) || []).find(Boolean);
  if (t || d) return `Hier steht: ${ITEMS[(t || d).b].name} – erst wegnehmen`;
  for (const k of ['a' + x + ',' + y, 'a' + x + ',' + (y + 1), 'b' + x + ',' + y, 'b' + (x + 1) + ',' + y])   // wie lowerHill: stünden sonst an der Kante
    if (state.edges.has(k)) return `Am Rand steht: ${ITEMS[state.edges.get(k).b].name} – erst entfernen`;
  for (const [vx, vy] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (postAt(vx, vy)) return `An der Ecke steht: ${ITEMS[postAt(vx, vy).b].name} – erst wegnehmen`;
  return null;
}
// Linie k an einer Treppe (edgeError): nicht quer vor den Fuß oder ans obere Ende, nicht mitten durch eine breite Treppe (die Linie
// stünde unten zwischen den Stufen); an die Seite schon
function stairEdgeError(k) {
  const [[ax, ay], [bx, by]] = edgeTiles(k), a = stairAt(ax, ay), b = stairAt(bx, by);
  if ((a && a.ecke) || (b && b.ecke)) return 'Nicht an die Ecktreppe';
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
// gleicher Richtung (Stufen laufen durch), 'k' eigener Keil; kind = Wandart der Anhöhe dahinter, top = Oberseite des Keils (Boden des Felds)
function stairLook(x, y, t) {
  const L = hillGap && hillGap.x === x && hillGap.y === y ? drawLevel : hillLevel;   // Geist der Vorschau in die Anhöhe: eine Ebene tiefer (echte Treppen nie)
  const rot = stairRotOf(t), [Du, Dv] = STAIR_UP[rot], Su = -Dv, Sv = Du, lv = L(x, y);
  const side = sg => {
    const nx = x + sg * Su, ny = y + sg * Sv, n = stairAt(nx, ny);
    if (L(nx, ny) > lv) return 'h';
    if (n && n.ecke) { const [D1, D2] = cornerAxes(stairRotOf(n)); return (nx + D1[0] === x && ny + D1[1] === y) || (nx + D2[0] === x && ny + D2[1] === y) ? 'j' : 'k'; }   // Ecktreppe daneben: läuft um die Ecke weiter
    return n && stairRotOf(n) === rot ? 'j' : 'k';
  };
  if (t.ecke) { const [D1, D2] = cornerAxes(rot); return { rot, ecke: true, style: stairStyleOf(t), kind: hillWall(hillAt(x + D1[0] + D2[0], y + D1[1] + D2[1])), m: 'j', p: 'j', top: groundTopAt(x, y) }; }
  return { rot, style: stairStyleOf(t), kind: hillWall(hillAt(x + Du, y + Dv)), m: side(-1), p: side(1), top: groundTopAt(x, y) };
}
// Treppe malen. P(u, v, up) → Bildpunkt (Feldkoordinaten relativ zur Feldmitte, Höhe in Bildpunkten bei Zoom 1); x, y: Feld (Musterraster).
// Von hinten nach vorn: Keil auf der abgewandten Seite, die Stufen (Trittfläche im Wegstil, sichtbare Stirnseite dunkler), Keil vorn
function paintStair(P, o, x, y) {
  if (o.ecke) { paintStairCorner(P, o, x, y); return; }
  const H = HILL_H, n = STAIR_N, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du, S = HILL_STY[o.kind] || HILL_STY.fels;
  const UV = (d, s) => [Du * d + Su * s, Dv * d + Sv * s];               // d längs (hinauf), s quer → (u, v)
  const W = (d, s, h) => P(...UV(d, s), h);
  const toward = Du + Dv > 0, nearP = Su + Sv > 0;                       // steigt zum Betrachter an (Stirnseiten abgewandt); Seite +S liegt vorn
  const lk = lookFar(pathLook(o.style), 1), riser = shade(lk.fill, -0.2);
  const lo = o.m === 'k' ? -0.5 + STAIR_CW : o.m === 'j' ? -0.51 : -0.5, hi = o.p === 'k' ? 0.5 - STAIR_CW : o.p === 'j' ? 0.51 : 0.5;   // zur Nachbartreppe: ohne Fuge
  const ll = Math.max(lo, -0.5), lh = Math.min(hi, 0.5);                // Kanten nur bis zur Feldgrenze: breit nie doppelt (sonst heller Fleck)
  const line = (a, b, col, w) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'butt'; g.stroke(); };
  // Keil = schmale Anhöhe neben den Stufen (Nutzer: „bündig“): oben auf der Linie der Stufenkanten – vorn so hoch wie die erste Stufe, ab der
  // obersten waagerecht auf Höhe der Anhöhe (kn); Oberseite wie der Boden, sichtbare Seiten als Wand mit derselben Grasnarbe wie die Anhöhe.
  // Oberseite hinten 0,0075 über die Feldgrenze (bk, wie Anhöhe an Anhöhe in paintHill): sonst ein feiner dunkler Strich an der Fuge zur
  // Oberseite dahinter (deren Wand schimmert durch die geglätteten Kanten) bzw. eine helle Kerbe in der dunklen Kante
  const hf = H / n, kn = 1 - 1 / n, bk = 0.5 + 0.0075;
  const keil = sg => {
    const sOut = 0.5 * sg, sIn = sg * (0.5 - STAIR_CW), outVis = sg * (Su + Sv) > 0;
    const sF = outVis ? sOut : sIn, nu = (outVis ? sg : -sg) * Su;       // sichtbare Seite: außen (vorderer Keil) bzw. innen (hinterer); zeigt nach +u?
    const topQ = [W(-0.5, sIn, hf), W(-0.5, sOut, hf), W(kn - 0.5, sOut, H), W(bk, sOut, H), W(bk, sIn, H), W(kn - 0.5, sIn, H)];
    poly(topQ, C(o.top || S.lip));
    if (!outVis) {                                                       // hinterer Keil: außen oben die dunkle Kante zur Wiese wie bei der Anhöhe (paintHill), 1,5 breit innen
      g.save();
      try {
        g.beginPath(); topQ.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
        const e = [W(-0.6, sOut, hf - H * 0.1), W(kn - 0.5, sOut, H), W(0.6, sOut, H)];
        g.beginPath(); e.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
        g.strokeStyle = 'rgba(45,85,30,0.5)'; g.lineWidth = 3; g.lineJoin = 'miter'; g.lineCap = 'butt'; g.stroke();
      } finally { g.restore(); }
    }
    const [a0, b0] = UV(-0.5, sF), [a1, b1] = UV(0.5, sF);
    paintHillWall(P, a0, b0, a1, b1, nu > 0 ? 'u' : 'v', o.kind, 0, hf, x * 5 + y * 9 + 3 * sg + o.rot, H, true, kn);
    if (!toward) {                                                       // Stirn am Fuß (zum Betrachter hin liegt die hintere in der Anhöhe)
      const [c0, e0] = UV(-0.5, sIn), [c1, e1] = UV(-0.5, sOut);
      paintHillWall(P, c0, e0, c1, e1, -Du > 0 ? 'u' : 'v', o.kind, 0, hf, x * 3 + y * 7 + sg + o.rot);
    }
  };
  const step = i => {
    const d0 = -0.5 + i / n, d1 = d0 + 1 / n, h = H * (i + 1) / n, hb = H * i / n;
    if (!toward) poly([W(d0, lo, hb), W(d0, hi, hb), W(d0, hi, h), W(d0, lo, h)], C(riser));   // Stirnseite
    const q = [UV(d0, lo), UV(d1, lo), UV(d1, hi), UV(d0, hi)], L = ([u, v]) => P(u, v, h);
    poly(q.map(L), C(lk.fill));
    if (lk.pat) { g.save(); clipTo([q], L); patSeam = true; try { pattern(L, lk.pat[0], x, y, 1, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); } finally { patSeam = false; g.restore(); } }
    if (!toward) line(W(d0, ll, h), W(d0, lh, h), 'rgba(255,255,255,0.35)', 0.7);   // Kante vorn im Licht
    else if (i > 0) line(W(d0, ll, h), W(d0, lh, h), 'rgba(40,30,20,0.28)', 0.9);   // steigt zum Betrachter an: Schattenkante, wo es hinabgeht
  };
  if ((nearP ? o.m : o.p) === 'k') keil(nearP ? -1 : 1);
  for (let j = 0; j < n; j++) step(toward ? j : n - 1 - j);
  if ((nearP ? o.p : o.m) === 'k') keil(nearP ? 1 : -1);
}
// Ecktreppe malen: n × n Zellen, Höhe je Zelle = Stufe min(i1, i2) (L-förmig um die Ecke); von hinten nach vorn (u + v), je Zelle die sichtbaren
// Seiten bis zur tieferen Nachbarzelle (außen bis zum Boden; zur Nachbartreppe gleich hoch – keine Seite), dann die Trittfläche im Wegstil.
// Kanten wie bei der geraden Treppe: oben an einer sichtbaren Stirnseite hell, wo es nach hinten hinabgeht dunkel
function paintStairCorner(P, o, x, y) {
  const H = HILL_H, n = STAIR_N, [D1, D2] = cornerAxes(o.rot);
  const UV = (s1, s2) => [D1[0] * (s1 - 0.5) + D2[0] * (s2 - 0.5), D1[1] * (s1 - 0.5) + D2[1] * (s2 - 0.5)];   // s1, s2: 0 außen … 1 zur Ecke
  const lk = lookFar(pathLook(o.style), 1), riser = shade(lk.fill, -0.2);
  const ht = (i, j) => i < 0 || j < 0 ? 0 : i >= n || j >= n ? H : H * (Math.min(i, j) + 1) / n;   // außen Boden, innen (Nachbartreppe/Anhöhe) oben
  const cells = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const [u, v] = UV((i + 0.5) / n, (j + 0.5) / n); cells.push([i, j, u + v]); }
  cells.sort((p, q) => p[2] - q[2]);
  const line = (a, b, col, w) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'butt'; g.stroke(); };
  for (const [i, j] of cells) {
    const h = ht(i, j), c = [UV(i / n, j / n), UV((i + 1) / n, j / n), UV((i + 1) / n, (j + 1) / n), UV(i / n, (j + 1) / n)];
    // Seiten: zu den vier Nachbarzellen (−s1, +s1, −s2, +s2) – sichtbar, wenn sie zum Betrachter zeigen und der Nachbar tiefer liegt
    const sides = [[c[0], c[3], i - 1, j, -1, 0], [c[1], c[2], i + 1, j, 1, 0], [c[0], c[1], i, j - 1, 0, -1], [c[3], c[2], i, j + 1, 0, 1]];
    const edgesTop = [];
    for (const [a, b, ni, nj, g1, g2] of sides) {
      const hn = ht(ni, nj);
      if (hn >= h) continue;
      const nu = D1[0] * g1 + D2[0] * g2, nv = D1[1] * g1 + D2[1] * g2, vis = nu + nv > 0;
      if (vis) poly([P(...a, hn), P(...b, hn), P(...b, h), P(...a, h)], C(riser));
      edgesTop.push([a, b, vis]);
    }
    const q = c.map(([u, v]) => P(u, v, h));
    poly(q, C(lk.fill));
    if (lk.pat) { const L = ([u, v]) => P(u, v, h); g.save(); clipTo([c], L); patSeam = true; try { pattern(L, lk.pat[0], x, y, 1, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); } finally { patSeam = false; g.restore(); } }
    for (const [a, b, vis] of edgesTop) line(P(...a, h), P(...b, h), vis ? 'rgba(255,255,255,0.35)' : 'rgba(40,30,20,0.28)', vis ? 0.7 : 0.9);
  }
}
const stairSig = o => (o.ecke ? 'E' : '') + o.rot + '|' + o.style + '|' + o.kind + '|' + o.m + o.p + '|' + o.top;
// drawObject 'huegeltreppe' (draw-objects.js): als Bildchen je Feld (wie drawHillTile, mit Zeitbudget beim Zoomen). Steht die Treppe so
// nicht auf dem Feld (Vorschau beim Bauen/Verschieben): ein eigenes Bildchen 'sg' mit dem Feld im Schlüssel (Muster im Weltraster).
// t kann eine Kopie sein (spriteTile malt mit einer) – verglichen wird der Inhalt, nicht das Ding
function drawHillStair(cx, cy, z, x, y, t) {
  t = t || stairAt(x, y);
  if (!t) return;
  if (t.ecke == null && !stairAt(x, y) && stairCornerNew(x, y)) t = { ...t, ecke: true };   // Geist der Vorschau: wird eine Ecktreppe
  const on = stairAt(x, y), real = !!on && stairRotOf(on) === stairRotOf(t) && on.style === t.style && !!on.ecke === !!t.ecke, key = real ? 's' + x + ',' + y : 'sg';
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
    const sg = nearP ? 1 : -1, sO = 0.5 * sg, sI = sg * (0.5 - STAIR_CW);   // Keil wie in paintStair: vorn eine Stufe hoch, ab der obersten waagerecht
    add(hull([[-0.5, 0], [-0.5, H / n], [0.5 - 1 / n, H], [0.5, H], [0.5, 0]].flatMap(([dd, h]) => [W(dd, sO, h), W(dd, sI, h)]))); any = true;
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
  paintStair(at(0, 0), { rot: 0, style: stairStyleOk(style) ? style : 'sand', kind: 'fels', m: 'h', p: 'k', top: '#a2d879' }, 1e6, 1e6);
}
