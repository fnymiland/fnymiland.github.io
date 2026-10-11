'use strict';
// ---------------------------------------------------------------------------
// Planen: Linie (Weg, Schiene) und Rechteck (Gelände, Weg-Fläche, Abriss, kleine Deko)
// Erst die Vorschau mit Anzahl und Preis, dann bestätigen – so passiert nichts aus Versehen.
// ---------------------------------------------------------------------------
// Klick, Klick: Linie. Ziehen: Schiene als Linie, sonst Rechteck. Ohne Ziehen bleibt beim Rechteck alles wie gehabt.
const LINE_TOOLS = new Set(['weg', 'dach', 'schiene', 'tunnel', 'fz_bahn', 'fz_hoch', 'fz_tief', 'pb_gleis', 'bruecke']);   // Überdachung wie der Weg (Block 138)   // Achterbahn-Schiene und Höhen-Pinsel (Block 60e)
const RECT_TOOLS = new Set(['weg', 'dach', 'graben', 'schuett', 'wiese', 'parkrasen', 'fzboden', 'strand', 'wald', 'obstwald', 'fels', 'anhoehe']);   // Anhöhe aufziehen (Block 157)
const dragKind = t => t === 'schiene' || t === 'tunnel' || t === 'bruecke' || t === 'fz_bahn' || t === 'fz_hoch' || t === 'fz_tief' || t === 'pb_gleis' ? 'line' : EDGE_TOOLS.has(t) ? 'edge'
  : RECT_TOOLS.has(t) || t === 'abriss' || (ITEMS[t] && ITEMS[t].small && !ITEMS[t].gift) || (t === 'verschieben' && !moving) ? 'rect' : null;
const PLAN_MAX = { line: 80, edge: 80, rect: 24 };   // Linie: Felder (Zaun: Kanten) insgesamt, Rechteck: Seitenlänge

// { kind: 'line'|'rect', tool, a: {x, y}, b: {x, y}, fixed, dragging, slot (kleine Deko: in welche Ecke) }
//   fixed = false: Linie per Klick begonnen, das Ende folgt der Maus – der nächste Klick baut
//   fixed = true:  die Vorschau steht – Klick/Tippen hinein baut, daneben bricht ab (Touch-Linie: neues Ende)
let plan = null;
// Tunnel entfernen im Tunnel-Werkzeug (Nutzer, 09.10.2026: „damit man nicht die halbe Stadt umbauen muss“): Schalter über der Leiste
// ⛏ Graben / 🗑️ Entfernen; entfernt wird nur der Tunnel – was darüber steht, bleibt. Gilt, bis ein anderes Werkzeug gewählt wird
let tunnelErase = false;
let planTouch = false;                            // zuletzt per Finger bedient (für den Hinweis im Schild)

// Linie von a nach b: erst in der längeren Richtung, dann einmal abbiegen (L-Form)
function lineTiles(a, b) {
  const out = [[a.x, a.y]], dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
  let x = a.x, y = a.y;
  const alongX = () => { while (x !== b.x) { x += dx; out.push([x, y]); } };
  const alongY = () => { while (y !== b.y) { y += dy; out.push([x, y]); } };
  if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) { alongX(); alongY(); } else { alongY(); alongX(); }
  return out;
}
const planBox = p => [Math.min(p.a.x, p.b.x), Math.min(p.a.y, p.b.y), Math.max(p.a.x, p.b.x), Math.max(p.a.y, p.b.y)];
function planTiles(p) {
  if (p.kind === 'line' || p.kind === 'edge') return lineTiles(p.a, p.b);      // Zaun: Eckpunkte statt Felder
  const [x0, y0, x1, y1] = planBox(p), out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}
function inPlan(p, x, y) {
  if (p.kind === 'rect') { const [x0, y0, x1, y1] = planBox(p); return x >= x0 && x <= x1 && y >= y0 && y <= y1; }
  return lineTiles(p.a, p.b).some(([px, py]) => px === x && py === y);
}
// Zaun, Hecke, Mauer: die Kanten zwischen den Eckpunkten der Linie
function planEdges(p) {
  const v = lineTiles(p.a, p.b), out = [];
  for (let i = 1; i < v.length; i++) out.push(edgeKeyOf({ x: v[i - 1][0], y: v[i - 1][1] }, { x: v[i][0], y: v[i][1] }));
  return out;
}
// Ende begrenzen, damit niemand aus Versehen die halbe Insel plant
function planEnd(kind, a, b) {
  const m = PLAN_MAX[kind], c = v => Math.max(-(m - 1), Math.min(m - 1, v));
  if (kind === 'rect') return { x: a.x + c(b.x - a.x), y: a.y + c(b.y - a.y) };
  let dx = b.x - a.x, dy = b.y - a.y;
  const over = Math.abs(dx) + Math.abs(dy) - (m - 1);
  if (over > 0) { const f = (m - 1) / (Math.abs(dx) + Math.abs(dy)); dx = Math.round(dx * f); dy = Math.round(dy * f); }
  return { x: a.x + dx, y: a.y + dy };
}
function startPlan(kind, a, b, fixed, slot = 0) {
  plan = { kind, tool, a: { x: a.x, y: a.y }, b: planEnd(kind, a, b), fixed, dragging: false, slot, ...(tool === 'tunnel' && tunnelErase ? { erase: true } : {}),
    ...(tool === 'weg' && a.deck ? { deck: true } : {}) };                 // auf dem Deck einer Brücke angefangen (Block 160): dort oben
}
function setPlanEnd(b) { if (plan) plan.b = planEnd(plan.kind, plan.a, b); }
function cancelPlan() { plan = null; }

// Ein Feld prüfen, ohne auf das Geld zu schauen (das zählt die Summe): ok, schon so (same) oder geht nicht
function planCheck(b, x, y) {
  const old = state.tiles.get(x + ',' + y);
  if (b === 'anhoehe') {                                                     // Anhöhe (Block 157): schon da – gleiche Wand oder umstellen (kostenlos)
    const h = ownedTile(x, y) && hillAt(x, y);
    if (h) return (h.w || 0) === (decoLookNew('anhoehe').form || 0) ? { same: true } : { cost: 0, mat: {} };
    const err = hillRaiseError(x, y, true);
    return err ? { err } : { cost: ITEMS.anhoehe.cost, mat: { ...(ITEMS.anhoehe.mat || {}) } };
  }
  if (b === 'pb_gleis' && old && isPbTrack(old.b)) return { same: true };    // Parkbahn: schon Gleis (Block 136)
  if (b === 'tunnel' && ownedTile(x, y) && tunnelAt(x, y)) return { same: true };   // liegt schon (Block 136)
  if (b === 'dach' && ownedTile(x, y) && roofSame(x, y)) return { same: true };      // Block 138
  if (b === 'schiene' && ownedTile(x, y) && old && old.b === 'schiene') return (old.form || 0) === (decoLookNew('schiene').form || 0) ? { same: true } : { cost: 0, mat: {} };   // Gleis-Stil (Block 109)
  if (b === 'schiene' && rampTrackAt(x, y)) return { same: true };            // Gleis-Rampe auf der Linie: ist schon Gleis (hills.js)
  if (STYLES[b] && ownedTile(x, y) && old && (old.b === b || (b === 'weg' && isCrossing(old)))) {      // umfärben
    const sameStyle = (old.style || 'sand') === currentStyle(b), shape = b === 'weg' && !old.bridge && !old.cross;   // Wegform: kostenlos (Block 77)
    return sameStyle ? (shape && !sameWegShape(old) ? { cost: 0, mat: {} } : { same: true }) : { cost: ITEMS[b].cost, mat: {} };
  }
  if (ownedTile(x, y) && crossCandidate(b, x, y)) {                                                    // Bahnübergang
    const err = crossError(b, x, y, true);
    return err ? { err } : costOf(b, x, y);
  }
  const err = placeError(b, x, y, undefined, { noCost: true });
  if (err) return { err };
  const c = costOf(b, x, y);
  return { cost: c.cost + clearCost(b, x, y), mat: c.mat };
}
// Alle Felder prüfen. Schiene/Aufschütten ins Meer: jedes Feld macht das nächste erreichbar – also in Runden
// prüfen und die neuen Felder dabei kurz als eigen zählen (danach wieder weg).
function planScan(p) {
  if (p.kind === 'edge') return scanEdges(p);
  if (p.tool === 'abriss') return scanDemolish(p);
  if (p.tool === 'tunnel' && p.erase) return scanTunnelErase(p);
  if (p.tool === 'verschieben') return scanSelect(p);
  if (ITEMS[p.tool].small) return scanSmall(p);
  if (p.tool === 'bruecke') return scanBruecke(p);                         // Brücke (Block 160, bruecken.js): als Ganzes
  const b = p.tool, states = new Map(), order = [], mat = {}, tmp = [], grow = CLAIM_TOOLS.has(b) || b === 'weg';   // Weg: Brücke wächst vom Ufer aus
  const deck = b === 'weg' ? bkPlanDeck(p) : null;                       // Weg über eine Brücke (Block 160): diese Felder oben aufs Deck
  let cost = 0, firstErr = null, rest = planTiles(p);
  if (b === 'weg') PLANNED = new Set();
  // Gleis-Rampe (hills.js) auf der Schienenlinie: nur längs ihrer Achse ist sie schon Gleis – quer verbindet sie nichts (levelLink 'gleis'),
  // die Linie bekäme dort zwei getrennte Enden. Ohne Anhöhen nie
  const quer = new Map();
  if (b === 'schiene' && p.kind === 'line' && hillsOn() && rampFresh().n) rest.forEach(([x, y], i) => {
    const r = rampAt(x, y);
    if (r && [rest[i - 1], rest[i + 1]].some(q => q && (r.rot & 1 ? q[1] !== y : q[0] !== x))) quer.set(x + ',' + y, { err: 'Quer über die Gleis-Rampe geht kein Gleis – sie führt nur hinauf' });
  });
  try {
    for (let round = 0; rest.length; round++) {
      const next = [];
      for (const [x, y] of rest) {
        const k = x + ',' + y, onDeck = !!deck && deck.has(k), c = quer.get(k) || (onDeck ? bkWegCheck(x, y) : planCheck(b, x, y));
        if (c.err) { next.push([x, y, c.err]); continue; }
        states.set(k, c.same ? 'same' : 'ok');
        if (c.same) continue;
        order.push([x, y, onDeck ? () => bkLayWeg(x, y) : () => build(b, x, y, true)]);
        if (onDeck) { cost += c.cost || 0; continue; }
        cost += c.cost || 0;
        for (const [r, n] of Object.entries(c.mat || {})) mat[r] = (mat[r] || 0) + n;
        if (PLANNED) PLANNED.add(k);
        if ((CLAIM_TOOLS.has(b) || (b === 'weg' && isSea(x, y))) && !ownedTile(x, y)) { state.claimed.add(k); tmp.push(k); }
      }
      if (!grow || next.length === rest.length) {
        for (const [x, y, err] of next) { states.set(x + ',' + y, 'bad'); firstErr = firstErr || err; }
        break;
      }
      rest = next;
    }
  } finally { for (const k of tmp) state.claimed.delete(k); PLANNED = null; }
  if (b === 'schiene') {                                                 // Gleis-Stil (Block 112): neue Strecke verlängern stellt das
    const old = ([x, y]) => bAt(x, y) === 'schiene';                    // Startgleis nicht mit um – umstellen nur, wenn nur Altes gezogen wird
    if (order.some(o => !old(o)) && order.some(old)) for (let i = order.length - 1; i >= 0; i--) if (old(order[i])) { states.set(order[i][0] + ',' + order[i][1], 'same'); order.splice(i, 1); }
  }
  const bad = [...states.values()].filter(s => s === 'bad').length;
  return { states, order, n: order.length, cost, gain: 0, mat, bad, firstErr, deck };
}
// Linie auf den Feldkanten: neu, umfärben (anderer Stil/Art) oder schon so
function scanEdges(p) {
  const b = p.tool, d = ITEMS[b], style = currentStyle(b), states = new Map(), order = [], mat = {};
  let cost = 0, firstErr = null;
  for (const k of planEdges(p)) {
    const old = state.edges.get(k), err = edgeError(b, k);
    if (err) { states.set(k, 'bad'); firstErr = firstErr || err; continue; }
    if (edgeSame(b, style, old)) { states.set(k, 'same'); continue; }    // auch die Farbe zählt (Block 145: sonst „schon alles fertig“)
    states.set(k, 'ok');
    const [x, y] = edgeTiles(k)[1];
    order.push([x, y, () => buildEdge(b, k)]);
    cost += d.cost - (old ? ITEMS[old.b].cost : 0);
    for (const [r, n] of Object.entries(d.mat || {})) mat[r] = (mat[r] || 0) + n;
  }
  const bad = [...states.values()].filter(s => s === 'bad').length;
  return { states, order, n: order.length, cost: Math.max(0, cost), gain: 0, mat, bad, firstErr };
}
// Kleine Deko: je Feld eine, in derselben Ecke wie am Anfang (ist sie belegt, die nächste freie)
function scanSmall(p) {
  const b = p.tool, d = ITEMS[b], states = new Map(), order = [], mat = {};
  let cost = 0, firstErr = null;
  for (const [x, y] of planTiles(p)) {
    const slot = freeSlot(x, y, p.slot), err = smallError(b, x, y, slot, { noCost: true });
    states.set(x + ',' + y, err ? 'bad' : 'ok');
    if (err) { firstErr = firstErr || err; continue; }
    order.push([x, y, () => buildSmall(b, x, y, slot)]);
    cost += d.cost + clearCost(b, x, y);
    for (const [r, n] of Object.entries(d.mat || {})) mat[r] = (mat[r] || 0) + n;
  }
  const bad = [...states.values()].filter(s => s === 'bad').length;
  return { states, order, n: order.length, cost, gain: 0, mat, bad, firstErr };
}
// Verschieben: welche Dinge die Auswahl anhebt (wie pickUpGroup) – nur zum Anzeigen
function scanSelect(p) {
  const states = new Map(), [x0, y0, x1, y1] = planBox(p), seen = new Set();
  let things = 0;
  const inside = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  for (const [x, y] of planTiles(p)) {
    const k = x + ',' + y, a = anchorAt(x, y), t = a && state.tiles.get(a);
    if ((decosAt(k) || []).some(Boolean)) { things += decosAt(k).filter(Boolean).length; states.set(k, 'ok'); }
    if (!t) { if (!states.has(k)) states.set(k, 'same'); continue; }
    if (seen.has(a)) continue;
    seen.add(a);
    const [ax, ay] = keyXY(a), fp = footprint(t.b, ax, ay, t.rot || 0, t);
    const ok = t.b !== 'lm' && !ITEMS[t.b].fixed && fp.every(([fx, fy]) => inside(fx, fy));
    for (const [fx, fy] of fp) if (inside(fx, fy)) states.set(fx + ',' + fy, ok ? 'ok' : 'bad');
    if (ok) things++;
  }
  const bad = [...states.values()].filter(s => s === 'bad').length;
  return { states, order: [], n: things, things, cost: 0, gain: 0, mat: {}, bad, firstErr: 'Hier ist nichts zum Verschieben' };
}
// Tunnel entfernen: jedes Tunnelfeld der Linie, voll zurück; unter einer U-Bahn-Station nicht (sie braucht ihn)
function scanTunnelErase(p) {
  const states = new Map(), order = [];
  let gain = 0, things = 0, firstErr = null;
  for (const [x, y] of planTiles(p)) {
    const k = x + ',' + y;
    if (!tunnelAt(x, y) || !ownedTile(x, y)) { states.set(k, 'same'); continue; }
    const err = tunnelEraseErr(x, y);
    if (err) { states.set(k, 'bad'); firstErr = firstErr || err; continue; }
    order.push([x, y, () => removeTunnel(x, y)]); gain += costOf('tunnel', x, y).cost; things++; states.set(k, 'ok');
  }
  return { states, order, n: things, things, cost: 0, gain, mat: {}, bad: [...states.values()].filter(s => s === 'bad').length, firstErr: firstErr || 'Hier liegt kein Tunnel' };
}
// Abriss: was ganz im Rechteck steht (Gebäude, Wege, Deko) kommt weg, Wald/Fels wird gerodet bzw. gesprengt
// (aus der ✋-Auswahl, Block 155a: `keepLand` – Wald/Fels bleiben, gerodet wird nur per 👆 einzeln).
// Leeres bleibt hell, was nicht geht (Rathaus, Sehenswürdigkeit, ragt hinaus) rot.
// Anhöhen (Block 157) werden zuletzt abgetragen, wo oben nichts stehen bleibt – auch aus der ✋-Auswahl (keepLand gilt nicht für sie).
function scanDemolish(p) {
  const states = new Map(), order = [], clear = [], lower = [], [x0, y0, x1, y1] = planBox(p), seen = new Set();
  let gain = 0, cost = 0, things = 0, firstErr = null, lost = 0, freed = 0, onHill = false;
  const inside = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  for (const [x, y] of planTiles(p)) {
    const k = x + ',' + y, ds = decosAt(k);
    if (ds) ds.forEach((dd, slot) => {
      if (!dd) return;
      order.push([x, y, () => { removeSmall(x, y, slot); return true; }]);
      gain += ITEMS[dd.b].cost; things++; states.set(k, 'ok');
    });
    const a = anchorAt(x, y), t = a && state.tiles.get(a);
    if (t) {
      if (seen.has(a)) continue;
      seen.add(a);
      const [ax, ay] = keyXY(a), fp = footprint(t.b, ax, ay, t.rot || 0, t), info = demolishInfo(ax, ay);
      const whole = fp.every(([fx, fy]) => inside(fx, fy)), err = !whole ? 'Ragt aus dem Rechteck heraus' : info.err;
      for (const [fx, fy] of fp) if (inside(fx, fy)) states.set(fx + ',' + fy, err ? 'bad' : 'ok');
      if (err) { firstErr = firstErr || err; continue; }
      order.push([ax, ay, () => { demolish(ax, ay); return true; }]);
      gain += info.refund; things++;
      lost += t.b === 'haus' ? HOUSE_STAGES[Math.min(t.lvl, HOUSE_STAGES.length) - 1].pop : (ITEMS[t.b].pop || 0) * t.lvl;
      freed += jobsOf(t);
      continue;
    }
    const info = ownedTile(x, y) ? demolishInfo(x, y) : { err: 'nichts' };
    if (info.hill) { if (!states.has(k)) states.set(k, 'same'); continue; }   // Anhöhe: kommt unten nach allem anderen dran (Block 157)
    if (info.tunnel && p.keepLand && !seeThrough) { if (!states.has(k)) states.set(k, 'same'); continue; }   // ✋-Auswahl: unsichtbare Tunnel nur mit 👁 (Block 155)
    if (info.tunnel || info.roof) { order.push([x, y, () => { demolish(x, y); return true; }]); gain += info.refund; things++; states.set(k, 'ok'); continue; }   // Tunnel (136), Dach (138)   // Tunnel (Block 136): einzeln und im Rechteck
    if (info.cost && !p.keepLand) { clear.push([x, y, () => { demolish(x, y); return true; }]); cost += info.cost; states.set(k, 'ok'); }
    else if (!states.has(k)) states.set(k, 'same');
  }
  if (bkOn()) for (const [bk, br] of state.bruecken) {                     // Brücke (Block 160): nur ganz im Rechteck, samt Weg darauf, voll zurück
    const cells = bkCellsOf(bk, br);
    if (!cells.some(([cx, cy]) => inside(cx, cy))) continue;
    if (!cells.every(([cx, cy]) => inside(cx, cy))) {                     // ragt hinaus: sie bleibt; was darunter abgerissen wird, bleibt grün
      for (const [cx, cy] of cells) if (inside(cx, cy) && states.get(cx + ',' + cy) !== 'ok') states.set(cx + ',' + cy, 'bad');
      firstErr = firstErr || 'Die Brücke ragt aus dem Rechteck heraus'; continue;
    }
    const [cx, cy] = cells[0];
    order.push([cx, cy, () => bkDemolishAt(cx, cy, true)]);
    gain += bkCost(bkArtOf(br), br.n).cost + (br.weg || []).filter(Boolean).length * ITEMS.weg.cost; things++;
    for (const [qx, qy] of cells) if (states.get(qx + ',' + qy) !== 'bad') states.set(qx + ',' + qy, 'ok');
    onHill = true;                                                        // ihre Anhöhen bleiben (erst, was oben steht)
  }
  for (let j = y0; j <= y1 + 1; j++) for (let i = x0; i <= x1 + 1; i++) for (const k of [i <= x1 ? 'a' + i + ',' + j : null, j <= y1 ? 'b' + i + ',' + j : null]) {
    if (!k || !state.edges.has(k)) continue;                                 // Zäune, Hecken, Mauern auf und um die Felder
    const [ex, ey] = edgeTiles(k)[1];
    for (const [tx, ty] of edgeTiles(k)) if (inside(tx, ty) && hillAt(tx, ty)) onHill = true;   // Zaun & Co. auf der Anhöhe
    order.push([ex, ey, () => removeEdge(k)]);
    gain += ITEMS[state.edges.get(k).b].cost; things++;
  }
  // Anhöhe (Block 157): abtragen, wenn oben nichts stehen bleibt (Rotes bleibt, samt Anhöhe) und an keiner Ecke von draußen etwas steht
  // (Eckpunkt-Deko braucht ringsum dieselbe Höhe). Direkt über lowerHill – im Batch wäre demolishInfo (COVER) noch vom alten Stand.
  // Nutzer 11.10.2026: „wenn man einen Weg oben auf einer Anhöhe löscht, löscht man die Anhöhe – doof“: steht oben etwas, das jetzt
  // abgerissen wird (Weg, Deko, Gebäude, Zaun), bleiben alle Anhöhen der Auswahl stehen; leer trägt sie das nächste Abreißen ab
  if (!onHill) onHill = planTiles(p).some(([x, y]) => hillAt(x, y) && states.get(x + ',' + y) === 'ok');
  if (state.hills && state.hills.size && !onHill) for (const [x, y] of planTiles(p)) {
    const k = x + ',' + y;
    if (!hillAt(x, y) || !ownedTile(x, y) || states.get(k) === 'bad') continue;
    if ([[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].some(([vx, vy]) => !inside(vx, vy) && postAt(vx, vy))) { states.set(k, 'bad'); firstErr = firstErr || 'An der Ecke der Anhöhe steht noch etwas'; continue; }
    // Treppe hinauf (Block 157d): nur mit ab, wenn sie selbst im Rechteck abgerissen wird (das passiert vorher, order)
    if (stairsAround(x, y).some(([sx, sy]) => !inside(sx, sy) || states.get(sx + ',' + sy) === 'bad')) { states.set(k, 'bad'); firstErr = firstErr || 'Hier führt eine Treppe hinauf – erst die Treppe abreißen'; continue; }
    if (rampsAround(x, y).some(([sx, sy]) => !inside(sx, sy) || states.get(sx + ',' + sy) === 'bad')) { states.set(k, 'bad'); firstErr = firstErr || 'Hier führt eine Gleis-Rampe hinauf – erst die Rampe abreißen'; continue; }   // Gleis-Rampe wie die Treppe
    if (archAround(x, y)) { states.set(k, 'bad'); firstErr = firstErr || ARCH_HERE; continue; }   // Fußgängerbrücke daneben (hills.js)
    if (bkOnHill(x, y)) { states.set(k, 'bad'); firstErr = firstErr || BK_ON_HILL; continue; }   // Brücke liegt auf (Block 160)
    lower.push([x, y, () => lowerHill(x, y)]);
    gain += ITEMS.anhoehe.cost; things++; states.set(k, 'ok');
  }
  if (lost && T.pop - lost < T.jobs - freed) firstErr = 'Hier wohnen Leute, die bei dir arbeiten. Erst Betriebe abreißen.';
  const bad = [...states.values()].filter(s => s === 'bad').length;
  return { states, order: order.concat(clear, lower), n: things + clear.length, things, cleared: clear.length, cost, gain, mat: {}, bad, firstErr,
    block: lost && T.pop - lost < T.jobs - freed };
}
// Ergebnis merken, bis sich etwas ändert (recalc zählt groundVersion hoch); Geld und Material immer frisch
let planMemo = null;
function planInfo(p) {
  const key = [p.kind, p.tool, p.keepLand ? 'k' : '', p.erase ? 'e' : '', p.deck ? 'd' : '', p.a.x, p.a.y, p.b.x, p.b.y, p.slot, STYLES[p.tool] ? currentStyle(p.tool) : '', DECO_LOOKS[p.tool] ? JSON.stringify(decoLookNew(p.tool)) : '', groundVersion].join();   // Gleis-Stil (Block 112)
  if (!planMemo || planMemo.key !== key) planMemo = { key, ...planScan(p) };
  const m = planMemo;
  const err = !m.n ? m.firstErr || (p.tool === 'abriss' ? 'Hier ist nichts zum Abreißen' : 'Hier ist schon alles fertig')
    : m.block ? m.firstErr
    : state.money + m.gain < m.cost ? `Zu wenig Taler (${fmt(m.cost)} nötig)` : matError(m.mat);
  return { ...m, err };
}
function planText(p, info) {
  const d = ITEMS[p.tool], parts = [];
  if (p.tool === 'verschieben') return `Auswahl: ${info.things} ${info.things === 1 ? 'Ding' : 'Dinge'}${info.bad ? ' · Rotes bleibt stehen' : ''} · ${p.fixed ? 'unten wählen, was damit passiert' : 'loslassen: auswählen'}`;
  if (p.erase) parts.push(`Tunnel entfernen: ${info.things} ${info.things === 1 ? 'Feld' : 'Felder'}${info.gain ? ' +' + fmt(info.gain) : ''}`);
  else if (p.tool === 'abriss') {
    if (info.things) parts.push(`Abreißen: ${info.things} ${info.things === 1 ? 'Ding' : 'Dinge'}${info.gain ? ' +' + fmt(info.gain) : ''}`);
    if (info.cleared) parts.push(`${info.cleared} ${info.cleared === 1 ? 'Feld' : 'Felder'} roden/sprengen −${fmt(info.cost)}`);
  } else if (p.tool === 'bruecke') {
    parts.push(`🌉 ${BK_ARTEN[info.art || bkArtNew()].name}${info.n ? `: ${info.n} ${info.n === 1 ? 'Feld' : 'Felder'}` : ''}`);   // Block 160
    if (info.cost) parts.push('−' + fmt(info.cost));
  } else {
    parts.push(d.small ? `${d.name} ×${info.n}` : d.edge ? `${d.name}: ${info.n} ${info.n === 1 ? 'Stück' : 'Stücke'}` : `${d.name}: ${info.n} ${info.n === 1 ? 'Feld' : 'Felder'}`);
    if (info.cost) parts.push('−' + fmt(info.cost));
  }
  if (matText(info.mat)) parts.push(matText(info.mat));
  if (info.bad) parts.push(`${info.bad} ${info.bad === 1 ? 'geht' : 'gehen'} nicht`);
  if (info.err) return info.n ? `${info.err} · ${parts.join(' · ')}` : info.err;
  const verb = p.erase ? 'entfernen' : p.tool === 'abriss' ? 'abreißen' : 'bauen';
  parts.push(planTouch ? `${p.kind !== 'rect' ? 'nochmal tippen' : 'hineintippen'}: ${verb}` : `${p.fixed ? 'hineinklicken' : 'Klick'}: ${verb}`);
  return parts.join(' · ');
}

// Bauen: alle guten Felder auf einmal, in der geprüften Reihenfolge; einmal rechnen, speichern, ein Ton
function runPlan() {
  const p = plan, info = planInfo(p);
  if (info.err) { fail(info.err); return false; }
  plan = null;
  const money0 = state.money;
  let n = 0;
  wegLaufPlan = p.tool === 'weg' ? planLauf(p) : null;                     // Wegrichtung (Block 158)
  try { batch(() => { for (const [, , run] of info.order) if (run()) n++; }); } finally { wegLaufPlan = null; }
  if (!n) return false;
  if (p.tool === 'dach' && roofAutoPillars(info.order.map(([x, y]) => [x, y]))) { recalc(); save(); }   // Stützen kommen mit (Block 138)
  noteRecent(p.tool);                                                     // zuletzt gebaut (Block 120)
  sfx(ITEMS[p.tool].small || ITEMS[p.tool].edge ? 'deco' : p.tool === 'weg' || p.tool === 'schiene' ? 'road' : 'dig');
  const [ex, ey] = info.order[info.order.length - 1], diff = state.money - money0;
  if (Math.round(diff)) addFloat(ex, ey, (diff > 0 ? '+' : '−') + fmt(Math.abs(diff)), diff > 0 ? '#3f8f43' : '#d9534a');
  checkStars();
  return true;
}

// Wegrichtung (Block 158): jedes Stück folgt seiner Zugrichtung – Linie: zum Vorgänger (die Ecke gehört zum ersten Schenkel), Fläche: die
// längere Seite; R (wegFlip) dreht um. Ein einzelnes Feld fehlt hier – es richtet sich nach den Nachbarn (wegLaufGuess)
function planLauf(p) {
  const out = new Map();
  if (p.kind === 'rect') {
    const [x0, y0, x1, y1] = planBox(p);
    if (x0 === x1 && y0 === y1) return out;
    for (const [x, y] of planTiles(p)) out.set(x + ',' + y, ((x1 - x0 >= y1 - y0 ? 0 : 1) ^ wegFlip) & 1);
    return out;
  }
  const v = lineTiles(p.a, p.b);
  if (v.length < 2) return out;
  v.forEach(([x, y], i) => { const o = v[i ? i - 1 : 1]; out.set(x + ',' + y, ((o[1] === y ? 0 : 1) ^ wegFlip) & 1); });
  return out;
}
// Tippen/Klicken, solange geplant wird (oder mit Weg/Schiene in der Hand). true = erledigt
function planTap(x, y, isTouch, deck = false) {
  planTouch = isTouch;
  if (plan && plan.tool === 'verschieben' && plan.fixed) {                    // markierte Auswahl (Block 134): hinein = verschieben, daneben = weg
    const [x0, y0, x1, y1] = planBox(plan);
    plan = null;
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) pickUpGroup(x0, y0, x1, y1);
    return true;
  }
  if (plan) {
    if (!plan.fixed) { setPlanEnd({ x, y }); runPlan(); return true; }        // Maus: der zweite Klick baut
    if (inPlan(plan, x, y)) { runPlan(); return true; }
    if (plan.kind !== 'rect' && isTouch) { setPlanEnd({ x, y }); hover = { x, y }; return true; }   // neues Ende
    plan = null;                                                                // daneben: abbrechen
    return true;
  }
  if (tool !== 'look' && EDGE_TOOLS.has(tool)) {                              // Zaun & Co.: x, y ist hier ein Eckpunkt
    startPlan('edge', { x, y }, { x, y }, isTouch);
    return true;
  }
  if (tool !== 'look' && LINE_TOOLS.has(tool) && (ownedTile(x, y) || (CLAIM_TOOLS.has(tool) && claimable(x, y)))) {
    startPlan('line', { x, y, deck }, { x, y }, isTouch);
    hover = { x, y };
    return true;
  }
  return false;
}
