'use strict';
// ---------------------------------------------------------------------------
// Planen: Linie (Weg, Schiene) und Rechteck (Gelände, Weg-Fläche, Abriss, kleine Deko)
// Erst die Vorschau mit Anzahl und Preis, dann bestätigen – so passiert nichts aus Versehen.
// ---------------------------------------------------------------------------
// Klick, Klick: Linie. Ziehen: Schiene als Linie, sonst Rechteck. Ohne Ziehen bleibt beim Rechteck alles wie gehabt.
const LINE_TOOLS = new Set(['weg', 'schiene']);
const RECT_TOOLS = new Set(['weg', 'graben', 'schuett', 'wiese', 'strand', 'wald', 'obstwald', 'fels']);
const dragKind = t => t === 'schiene' ? 'line' : EDGE_TOOLS.has(t) ? 'edge'
  : RECT_TOOLS.has(t) || t === 'abriss' || (ITEMS[t] && ITEMS[t].small) || (t === 'verschieben' && !moving) ? 'rect' : null;
const PLAN_MAX = { line: 80, edge: 80, rect: 24 };   // Linie: Felder (Zaun: Kanten) insgesamt, Rechteck: Seitenlänge

// { kind: 'line'|'rect', tool, a: {x, y}, b: {x, y}, fixed, dragging, slot (kleine Deko: in welche Ecke) }
//   fixed = false: Linie per Klick begonnen, das Ende folgt der Maus – der nächste Klick baut
//   fixed = true:  die Vorschau steht – Klick/Tippen hinein baut, daneben bricht ab (Touch-Linie: neues Ende)
let plan = null;
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
  plan = { kind, tool, a: { x: a.x, y: a.y }, b: planEnd(kind, a, b), fixed, dragging: false, slot };
}
function setPlanEnd(b) { if (plan) plan.b = planEnd(plan.kind, plan.a, b); }
function cancelPlan() { plan = null; }

// Ein Feld prüfen, ohne auf das Geld zu schauen (das zählt die Summe): ok, schon so (same) oder geht nicht
function planCheck(b, x, y) {
  const old = state.tiles.get(x + ',' + y);
  if (STYLES[b] && ownedTile(x, y) && old && (old.b === b || (b === 'weg' && isCrossing(old)))) {      // umfärben
    return (old.style || 'sand') === currentStyle(b) ? { same: true } : { cost: ITEMS[b].cost, mat: {} };
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
  if (p.tool === 'verschieben') return scanSelect(p);
  if (ITEMS[p.tool].small) return scanSmall(p);
  const b = p.tool, states = new Map(), order = [], mat = {}, tmp = [];
  let cost = 0, firstErr = null, rest = planTiles(p);
  try {
    for (let round = 0; rest.length; round++) {
      const next = [];
      for (const [x, y] of rest) {
        const c = planCheck(b, x, y), k = x + ',' + y;
        if (c.err) { next.push([x, y, c.err]); continue; }
        states.set(k, c.same ? 'same' : 'ok');
        if (c.same) continue;
        order.push([x, y, () => build(b, x, y, true)]);
        cost += c.cost || 0;
        for (const [r, n] of Object.entries(c.mat || {})) mat[r] = (mat[r] || 0) + n;
        if (CLAIM_TOOLS.has(b) && !ownedTile(x, y)) { state.claimed.add(k); tmp.push(k); }
      }
      if (!CLAIM_TOOLS.has(b) || next.length === rest.length) {
        for (const [x, y, err] of next) { states.set(x + ',' + y, 'bad'); firstErr = firstErr || err; }
        break;
      }
      rest = next;
    }
  } finally { for (const k of tmp) state.claimed.delete(k); }
  const bad = [...states.values()].filter(s => s === 'bad').length;
  return { states, order, n: order.length, cost, gain: 0, mat, bad, firstErr };
}
// Linie auf den Feldkanten: neu, umfärben (anderer Stil/Art) oder schon so
function scanEdges(p) {
  const b = p.tool, d = ITEMS[b], style = currentStyle(b), states = new Map(), order = [], mat = {};
  let cost = 0, firstErr = null;
  for (const k of planEdges(p)) {
    const old = state.edges.get(k), err = edgeError(b, k);
    if (err) { states.set(k, 'bad'); firstErr = firstErr || err; continue; }
    if (old && old.b === b && old.style === style) { states.set(k, 'same'); continue; }
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
// Abriss: was ganz im Rechteck steht (Gebäude, Wege, Deko) kommt weg, Wald/Fels wird gerodet bzw. gesprengt.
// Leeres bleibt hell, was nicht geht (Rathaus, Sehenswürdigkeit, ragt hinaus) rot.
function scanDemolish(p) {
  const states = new Map(), order = [], clear = [], [x0, y0, x1, y1] = planBox(p), seen = new Set();
  let gain = 0, cost = 0, things = 0, firstErr = null, lost = 0, freed = 0;
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
    if (info.cost) { clear.push([x, y, () => { demolish(x, y); return true; }]); cost += info.cost; states.set(k, 'ok'); }
    else if (!states.has(k)) states.set(k, 'same');
  }
  for (let j = y0; j <= y1 + 1; j++) for (let i = x0; i <= x1 + 1; i++) for (const k of [i <= x1 ? 'a' + i + ',' + j : null, j <= y1 ? 'b' + i + ',' + j : null]) {
    if (!k || !state.edges.has(k)) continue;                                 // Zäune, Hecken, Mauern auf und um die Felder
    const [ex, ey] = edgeTiles(k)[1];
    order.push([ex, ey, () => removeEdge(k)]);
    gain += ITEMS[state.edges.get(k).b].cost; things++;
  }
  if (lost && T.pop - lost < T.jobs - freed) firstErr = 'Hier wohnen Leute, die bei dir arbeiten. Erst Betriebe abreißen.';
  const bad = [...states.values()].filter(s => s === 'bad').length;
  return { states, order: order.concat(clear), n: things + clear.length, things, cleared: clear.length, cost, gain, mat: {}, bad, firstErr,
    block: lost && T.pop - lost < T.jobs - freed };
}
// Ergebnis merken, bis sich etwas ändert (recalc zählt groundVersion hoch); Geld und Material immer frisch
let planMemo = null;
function planInfo(p) {
  const key = [p.kind, p.tool, p.a.x, p.a.y, p.b.x, p.b.y, p.slot, STYLES[p.tool] ? currentStyle(p.tool) : '', groundVersion].join();
  if (!planMemo || planMemo.key !== key) planMemo = { key, ...planScan(p) };
  const m = planMemo;
  const err = !m.n ? m.firstErr || (p.tool === 'abriss' ? 'Hier ist nichts zum Abreißen' : 'Hier ist schon alles fertig')
    : m.block ? m.firstErr
    : state.money + m.gain < m.cost ? `Zu wenig Taler (${fmt(m.cost)} nötig)` : matError(m.mat);
  return { ...m, err };
}
function planText(p, info) {
  const d = ITEMS[p.tool], parts = [];
  if (p.tool === 'verschieben') return `Verschieben: ${info.things} ${info.things === 1 ? 'Ding' : 'Dinge'}${info.bad ? ' · Rotes bleibt stehen' : ''} · loslassen: anheben`;
  if (p.tool === 'abriss') {
    if (info.things) parts.push(`Abreißen: ${info.things} ${info.things === 1 ? 'Ding' : 'Dinge'}${info.gain ? ' +' + fmt(info.gain) : ''}`);
    if (info.cleared) parts.push(`${info.cleared} ${info.cleared === 1 ? 'Feld' : 'Felder'} roden/sprengen −${fmt(info.cost)}`);
  } else {
    parts.push(d.small ? `${d.name} ×${info.n}` : d.edge ? `${d.name}: ${info.n} ${info.n === 1 ? 'Stück' : 'Stücke'}` : `${d.name}: ${info.n} ${info.n === 1 ? 'Feld' : 'Felder'}`);
    if (info.cost) parts.push('−' + fmt(info.cost));
  }
  if (matText(info.mat)) parts.push(matText(info.mat));
  if (info.bad) parts.push(`${info.bad} ${info.bad === 1 ? 'geht' : 'gehen'} nicht`);
  if (info.err) return info.n ? `${info.err} · ${parts.join(' · ')}` : info.err;
  const verb = p.tool === 'abriss' ? 'abreißen' : 'bauen';
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
  batch(() => { for (const [, , run] of info.order) if (run()) n++; });
  if (!n) return false;
  sfx(ITEMS[p.tool].small || ITEMS[p.tool].edge ? 'deco' : p.tool === 'weg' || p.tool === 'schiene' ? 'road' : 'dig');
  const [ex, ey] = info.order[info.order.length - 1], diff = state.money - money0;
  if (Math.round(diff)) addFloat(ex, ey, (diff > 0 ? '+' : '−') + fmt(Math.abs(diff)), diff > 0 ? '#3f8f43' : '#d9534a');
  checkStars();
  return true;
}

// Tippen/Klicken, solange geplant wird (oder mit Weg/Schiene in der Hand). true = erledigt
function planTap(x, y, isTouch) {
  planTouch = isTouch;
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
    startPlan('line', { x, y }, { x, y }, isTouch);
    hover = { x, y };
    return true;
  }
  return false;
}
