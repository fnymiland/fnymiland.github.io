'use strict';
// ---------------------------------------------------------------------------
// Planen: Linie (Weg, Schiene) und Rechteck (Gelände, Weg-Fläche)
// Erst die Vorschau mit Anzahl und Preis, dann bestätigen – so passiert nichts aus Versehen.
// ---------------------------------------------------------------------------
// Klick, Klick: Linie. Ziehen: Schiene als Linie, sonst Rechteck. Ohne Ziehen bleibt beim Rechteck alles wie gehabt.
const LINE_TOOLS = new Set(['weg', 'schiene']);
const RECT_TOOLS = new Set(['weg', 'graben', 'schuett', 'wiese', 'strand', 'wald', 'obstwald', 'fels']);
const dragKind = t => t === 'schiene' ? 'line' : RECT_TOOLS.has(t) ? 'rect' : null;
const PLAN_MAX = { line: 80, rect: 24 };        // Linie: Felder insgesamt, Rechteck: Seitenlänge

// { kind: 'line'|'rect', tool, a: {x, y}, b: {x, y}, fixed, dragging }
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
  if (p.kind === 'line') return lineTiles(p.a, p.b);
  const [x0, y0, x1, y1] = planBox(p), out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}
function inPlan(p, x, y) {
  if (p.kind === 'rect') { const [x0, y0, x1, y1] = planBox(p); return x >= x0 && x <= x1 && y >= y0 && y <= y1; }
  return lineTiles(p.a, p.b).some(([px, py]) => px === x && py === y);
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
function startPlan(kind, a, b, fixed) {
  plan = { kind, tool, a: { x: a.x, y: a.y }, b: planEnd(kind, a, b), fixed, dragging: false };
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
        order.push([x, y]);
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
  return { states, order, n: order.length, cost, mat, bad, firstErr };
}
// Ergebnis merken, bis sich etwas ändert (recalc zählt groundVersion hoch); Geld und Material immer frisch
let planMemo = null;
function planInfo(p) {
  const key = [p.kind, p.tool, p.a.x, p.a.y, p.b.x, p.b.y, STYLES[p.tool] ? currentStyle(p.tool) : '', groundVersion].join();
  if (!planMemo || planMemo.key !== key) planMemo = { key, ...planScan(p) };
  const m = planMemo;
  const err = !m.n ? m.firstErr || 'Hier ist schon alles fertig'
    : state.money < m.cost ? `Zu wenig Taler (${fmt(m.cost)} nötig)` : matError(m.mat);
  return { ...m, err };
}
function planText(p, info) {
  const d = ITEMS[p.tool], parts = [`${d.name}: ${info.n} ${info.n === 1 ? 'Feld' : 'Felder'}`];
  if (info.cost) parts.push('−' + fmt(info.cost));
  if (matText(info.mat)) parts.push(matText(info.mat));
  if (info.bad) parts.push(`${info.bad} ${info.bad === 1 ? 'geht' : 'gehen'} nicht`);
  if (info.err) return info.n ? `${info.err} · ${parts.join(' · ')}` : info.err;
  parts.push(planTouch ? 'nochmal tippen: bauen' : p.fixed ? 'hineinklicken: bauen' : 'Klick: bauen');
  return parts.join(' · ');
}

// Bauen: alle guten Felder auf einmal, in der geprüften Reihenfolge; einmal rechnen, speichern, ein Ton
function runPlan() {
  const p = plan, info = planInfo(p);
  if (info.err) { fail(info.err); return false; }
  plan = null;
  const money0 = state.money;
  let n = 0;
  batch(() => { for (const [x, y] of info.order) if (build(p.tool, x, y, true)) n++; });
  if (!n) return false;
  sfx(TERRAFORM[p.tool] || p.tool === 'graben' || p.tool === 'schuett' ? 'dig' : 'road');
  const [ex, ey] = info.order[info.order.length - 1];
  if (money0 > state.money) addFloat(ex, ey, '−' + fmt(money0 - state.money), '#d9534a');
  checkStars();
  return true;
}

// Tippen/Klicken, solange geplant wird (oder mit Weg/Schiene in der Hand). true = erledigt
function planTap(x, y, isTouch) {
  planTouch = isTouch;
  if (plan) {
    if (!plan.fixed) { setPlanEnd({ x, y }); runPlan(); return true; }        // Maus: der zweite Klick baut
    if (inPlan(plan, x, y)) { runPlan(); return true; }
    if (plan.kind === 'line' && isTouch) { setPlanEnd({ x, y }); hover = { x, y }; return true; }   // neues Ende
    plan = null;                                                                // daneben: abbrechen
    return true;
  }
  if (tool !== 'look' && LINE_TOOLS.has(tool) && (ownedTile(x, y) || (CLAIM_TOOLS.has(tool) && claimable(x, y)))) {
    startPlan('line', { x, y }, { x, y }, isTouch);
    hover = { x, y };
    return true;
  }
  return false;
}
