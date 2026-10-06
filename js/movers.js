'use strict';
// ---------------------------------------------------------------------------
// Bewohner und Fahrzeuge
// ---------------------------------------------------------------------------
const FUR = ['#f4c28f', '#c9a27e', '#fffaf2', '#b9b9c6', '#f7d9a8', '#e7a06c', '#9c7b64'];
const SHIRTS = ['#e8705f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1'];
const CARS = ['#e8705f', '#5f8fe8', '#58b36a', '#ffffff', '#b07ad6', '#f2b53a'];
const walkers = [], cars = [], strollers = [];   // strollers (Block 44): Spaziergänger im Park
const walkable = (x, y, open = false) => {             // open: Schranke egal (wer schon drauf ist, geht weiter)
  if (!ownedTile(x, y)) return false;
  const t = objAt(x, y);
  if (terrainAt(x, y) === 'water') return isWegBridge(t);                          // übers Wasser nur auf einer Wegbrücke (Block 66)
  return !t || t.b === 'weg' || (isCrossing(t) && (t.foot || open || !crossingClosed(x, y)));   // an der Schranke warten, über die Brücke nie
};
// Schranke zu, sobald ein Zugwagen in der Nähe ist
function crossingClosed(x, y) {
  if (!trains.length) return false;
  return trainCars().some(c => Math.abs(c.px - x) + Math.abs(c.py - y) < 2.3);
}
const drivable = () => false;

// Tagesablauf (Block 55, Spieluhr seit Block 101: 1 Minute = 1 Spielstunde) in vier Teile – morgens zur Arbeit oder Schule, mittags essen und
// einkaufen, abends in den Park, nachts sind (fast) alle zu Hause. Mit ?stunde=N nach der echten Uhrzeit.
const DAY_PARTS = [[0, 'nacht'], [5, 'morgen'], [11, 'mittag'], [15, 'abend'], [21, 'nacht']];   // ab Spielstunde
function dayPart(ms = Date.now()) {
  const m = gameHour(ms);
  let part = 'morgen';
  for (const [from, id] of DAY_PARTS) if (m >= from) part = id;
  return part;
}
const GOAL_PLAN = { morgen: ['arbeit', 'arbeit', 'arbeit', 'schule'], mittag: ['essen', 'essen', 'laden', 'laden', 'markt', 'fzpark'], abend: ['park', 'park', 'park', 'fzpark', 'fzpark', 'bummel'], nacht: ['bummel'] };
const GOAL_OF = {
  arbeit: b => !!ITEMS[b].workers && !isHome(b) && !['schule', 'bibliothek', 'uni'].includes(b),
  schule: b => ['schule', 'bibliothek', 'uni'].includes(b),
  essen: b => SHOP_GROUPS.essen.includes(baseOf(b)) || b === 'baecker',
  laden: b => SHOP_GROUPS.laeden.includes(baseOf(b)) || SHOP_GROUPS.gross.includes(baseOf(b)),
  markt: b => !!STANDS[b],
};
// Felder direkt neben einem Gebäude, auf denen man stehen kann (die „Tür“)
function doorsOf(k) {
  const t = state.tiles.get(k);
  if (!t) return [];
  const [ax, ay] = keyXY(k), [w, h] = sizeOf(t.b, t.rot, t), out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) for (const [dx, dy] of DIRS) {
    const x = ax + i + dx, y = ay + j + dy;
    if ((x < ax || x >= ax + w || y < ay || y >= ay + h) && walkable(x, y)) out.push([x, y]);
  }
  return out;
}
// Kürzester Fußweg (nicht durch Zäune) zu einem der Zielfelder; Liste der Felder ohne den Start, null wenn keiner
function walkPath(sx, sy, goals, limit = 2500) {
  const want = new Set(goals.map(([x, y]) => x + ',' + y)), start = sx + ',' + sy;
  if (want.has(start)) return [];
  const prev = new Map([[start, null]]), q = [[sx, sy]];
  for (let i = 0; i < q.length && prev.size < limit; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, nk = nx + ',' + ny;
      if (prev.has(nk) || !walkable(nx, ny) || edgeBlocks(x, y, nx, ny)) continue;
      prev.set(nk, x + ',' + y);
      if (want.has(nk)) {
        const out = [];
        for (let k = nk; k !== start; k = prev.get(k)) out.push(keyXY(k));
        return out.reverse();
      }
      q.push([nx, ny]);
    }
  }
  return null;
}
// Ziel für einen Bewohner: ein passendes Gebäude in der Nähe (eins der fünf nächsten) bzw. ein Stück Parkrasen
function findGoal(kind, x, y) {
  const reg = regionAt(x, y), near = [];
  if (kind === 'park' || kind === 'fzpark') {                          // Park bzw. Freizeitpark (Block 60d): ein begehbares Feld darin
    for (const p of kind === 'park' ? PARKS : FZPARKS) for (const k of p.tiles) { const [px, py] = keyXY(k); if (walkable(px, py)) near.push({ k, d: Math.abs(px - x) + Math.abs(py - y), tiles: [[px, py]] }); }
  } else if (GOAL_OF[kind]) {
    for (const [k, t] of state.tiles) {
      if (!GOAL_OF[kind](t.b)) continue;
      const [gx, gy] = keyXY(k), d = Math.abs(gx - x) + Math.abs(gy - y);
      if (d <= 30 && regionAt(gx, gy) === reg) near.push({ k, d });
    }
  }
  near.sort((a, b) => a.d - b.d);
  const pick = near.slice(0, 5);
  return pick.length ? pick[Math.floor(Math.random() * pick.length)] : null;
}
// Unterwegs zu goal (kind, k); ohne Ziel oder Weg dorthin: ein Stück bummeln
function setGoal(w, kind) {
  const g = kind === 'home' ? { k: w.home } : findGoal(kind, w.fx, w.fy);
  const path = g && walkPath(w.fx, w.fy, g.tiles || doorsOf(g.k));
  if (path) { w.goal = { kind, k: g.k }; w.path = path; w.steps = null; return true; }
  if (kind === 'home') { w.gone = true; return false; }                     // kein Weg nach Hause: geht einfach rein
  w.goal = { kind: 'bummel' }; w.path = null; w.steps = 6 + Math.floor(Math.random() * 10);
  return false;
}
// Angekommen: ins Gebäude (eine Weile unsichtbar), im Park bummeln, zu Hause verschwinden
function arrive(w) {
  const kind = w.goal && w.goal.kind;
  if (kind === 'home') { w.gone = true; return; }
  if (kind === 'park' || kind === 'fzpark') { w.path = null; w.steps = 8 + Math.floor(Math.random() * 12); w.goal = { kind, k: w.goal.k, there: true }; return; }
  if (GOAL_OF[kind]) { w.inside = 6 + Math.random() * 10; return; }
  setGoal(w, 'home');
}
function stepWalker(w, dt) {
  if (w.inside > 0) { w.inside -= dt; if (w.inside <= 0) { w.inside = 0; setGoal(w, 'home'); } return; }
  if (!w.path) {                                                         // bummeln wie früher; danach heim
    stepMover(w, dt, walkable, true);
    if (w.t === 0 && w.steps != null && --w.steps <= 0) setGoal(w, 'home');
    return;
  }
  if (!walkable(w.fx, w.fy, true)) { w.gone = true; return; }
  if (w.wait > 0) { w.wait -= dt; return; }
  w.t += dt * w.speed;
  if (w.t >= 1) {
    w.fx = w.tx; w.fy = w.ty; w.t = 0;
    const nx = w.path[0];
    if (!nx) { w.path = null; arrive(w); }
    else if (!walkable(nx[0], nx[1], true) || edgeBlocks(w.fx, w.fy, nx[0], nx[1])) { w.path = null; w.steps = 4; }   // inzwischen verbaut
    else if (!walkable(nx[0], nx[1])) { w.tx = w.fx; w.ty = w.fy; w.wait = 0.4; }    // Schranke zu: davor warten (Block 84c)
    else { w.path.shift(); [w.tx, w.ty] = nx; }
  }
  w.px = w.fx + (w.tx - w.fx) * w.t;
  w.py = w.fy + (w.ty - w.fy) * w.t;
}
// Wer in einem Haus wohnt (Haus-Feld, Index), mit Tierart und Fellfarbe
function residentLook(home, who) {
  const r = residentsOf(state.tiles.get(home))[who] || {}, a = animalOf(r);
  return { home, who, kind: Math.max(0, ANIMALS.indexOf(a)), fur: a.fur || FUR[Math.floor(Math.random() * FUR.length)] };
}
let lastPart = null;
function syncMovers() {
  const part = dayPart(), day = Math.min(24, Math.floor(T.pop / 4)), wantW = part === 'nacht' ? Math.ceil(day * 0.25) : day;
  if (part !== lastPart) {                                               // es wird Nacht: alle machen sich auf den Heimweg
    if (part === 'nacht' && lastPart) for (const w of walkers) if (!w.pin && !w.inside && !(w.goal && w.goal.kind === 'home')) setGoal(w, 'home');
    lastPart = part;
  }
  const out = walkers.filter(w => !w.pin && !(w.goal && w.goal.kind === 'home'));
  if (out.length > wantW) setGoal(out[out.length - 1], 'home');           // zu viele draußen: einer geht heim
  while (walkers.length > wantW + 12) walkers.pop();
  if (walkers.length < wantW) {
    const homes = [...state.tiles].filter(([, t]) => isHome(t.b) && t.animal);   // Bewohner kommen aus jedem Wohnhaus
    if (homes.length) {
      const [hk, ht] = homes[Math.floor(Math.random() * homes.length)], doors = doorsOf(hk);
      if (doors.length) {
        const [sx, sy] = doors[Math.floor(Math.random() * doors.length)];
        const w = { fx: sx, fy: sy, tx: sx, ty: sy, px: sx, py: sy, t: 1, wait: 0.5, ...residentLook(hk, Math.floor(Math.random() * residentsOf(ht).length)),
          shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], speed: 0.7 + Math.random() * 0.4 };
        const plan = GOAL_PLAN[part];
        setGoal(w, plan[Math.floor(Math.random() * plan.length)]);
        if (!w.gone) walkers.push(w);
      }
    }
  }
  syncStrollers();
  syncParade();
  cars.length = 0;             // keine Straßen mehr – dafür fahren Züge (syncTrains)
  syncTrains();
}
// Spaziergänger (Block 44): bis zu 2 je Park-Stufe (+1), nur auf dem Parkrasen, setzen sich gern auf eine Bank
const parkWalk = (x, y) => terraLook(x, y) === 'park' && walkable(x, y);
function syncStrollers() {
  const want = T.pop ? Math.min(12, PARKS.reduce((n, p) => n + Math.min(p.stage * 2 + 1, Math.floor(p.tiles.length / 3)), 0)) : 0;
  while (strollers.length > want) strollers.pop();
  if (strollers.length >= want) return;
  const p = PARKS[Math.floor(Math.random() * PARKS.length)], free = p.tiles.map(keyXY).filter(([x, y]) => parkWalk(x, y));
  if (!free.length) return;
  const [sx, sy] = free[Math.floor(Math.random() * free.length)];
  const homes = [...state.tiles].filter(([, t]) => isHome(t.b) && t.animal), [hk, ht] = homes.length ? homes[Math.floor(Math.random() * homes.length)] : [null, null];
  strollers.push({ fx: sx, fy: sy, tx: sx, ty: sy, px: sx, py: sy, t: 1, wait: 1, stroll: true,
    ...(hk ? residentLook(hk, Math.floor(Math.random() * residentsOf(ht).length)) : { kind: Math.floor(Math.random() * 3), fur: FUR[Math.floor(Math.random() * FUR.length)] }),
    shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], speed: 0.35 + Math.random() * 0.25 });   // gemütlich
}
// Bank auf dem Feld? Dann dort Platz nehmen (Position der Bank, eine Weile sitzen)
function sitDown(w) {
  const ds = decosAt(w.fx + ',' + w.fy), i = ds ? ds.findIndex(d => d && d.b === 'bank' && !['rund', 'picknick'].includes(lookForm('bank', d))) : -1;   // Rundbank/Picknicktisch: kein Platz in der Mitte (Block 106)
  if (i < 0 || Math.random() > 0.6 || strollers.some(o => o !== w && o.sit && o.fx === w.fx && o.fy === w.fy)) return false;
  const [u, v] = slotPos(w.fx, w.fy, i, ds[i]);
  w.sit = true; w.wait = 5 + Math.random() * 7; w.tx = w.fx; w.ty = w.fy; w.t = 0;
  w.px = w.fx + u; w.py = w.fy + v;
  return true;
}
function stepMover(w, dt, ok, preferWay) {
  if (!ok(w.tx, w.ty)) { w.tx = w.fx; w.ty = w.fy; w.t = 1; }
  if (!ok(w.fx, w.fy)) { w.gone = true; return; }
  if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0) w.sit = false; return; }
  w.t += dt * w.speed;
  if (w.t >= 1) {
    const px = w.fx, py = w.fy;
    w.fx = w.tx; w.fy = w.ty; w.t = 0;
    if (w.stroll && (px !== w.fx || py !== w.fy) && sitDown(w)) return;
    const cands = DIRS.map(([dx, dy]) => [w.fx + dx, w.fy + dy]).filter(([a, b]) => ok(a, b) && !(w.fur && edgeBlocks(w.fx, w.fy, a, b)));   // Bewohner nicht durch Zäune
    let pool = cands;
    if (preferWay) {
      const ways = cands.filter(([a, b]) => bAt(a, b) === 'weg');
      if (ways.length && Math.random() < (bAt(w.fx, w.fy) === 'weg' ? 0.95 : 0.6)) pool = ways;
    }
    if (pool.length > 1) pool = pool.filter(([a, b]) => a !== px || b !== py);
    if (w.stroll && pool.length > 1 && Math.random() < 0.45) {        // Spaziergänger steuern gern die nächste Bank an
      const benches = [];
      for (const [k, ds] of state.decos) if (terraLook(...keyXY(k)) === 'park' && ds.some(d => d && d.b === 'bank')) benches.push(keyXY(k));
      const dist = ([a, b]) => Math.min(...benches.map(([bx, by]) => Math.abs(bx - a) + Math.abs(by - b)));
      if (benches.length) { const m = Math.min(...pool.map(dist)); pool = pool.filter(c => dist(c) === m); }
    }
    if (!pool.length) { w.tx = w.fx; w.ty = w.fy; w.wait = 1; }
    else {
      [w.tx, w.ty] = pool[Math.floor(Math.random() * pool.length)];
      if (preferWay && Math.random() < 0.12) w.wait = 1 + Math.random() * 2.5;
      if (w.bus && bAt(w.fx + 1, w.fy) === 'bus' || w.bus && bAt(w.fx, w.fy + 1) === 'bus') w.wait = 1.2;
    }
  }
  w.px = w.fx + (w.tx - w.fx) * w.t;
  w.py = w.fy + (w.ty - w.fy) * w.t;
}
function stepMovers(dt) {
  stepTrains(dt);
  stepCoasters(dt);
  stepCritters(performance.now());
  for (const w of walkers) stepWalker(w, dt);
  if (typeof stepMe === 'function') stepMe(dt);                         // eigene Figur (Block 97)
  for (const w of strollers) stepMover(w, dt, parkWalk, true);
  for (const w of paraders) stepMover(w, dt, fzWalk, false);
  for (const c of cars) stepMover(c, dt, drivable, false);
  for (const list of [walkers, cars, strollers, paraders]) for (let i = list.length - 1; i >= 0; i--) if (list[i].gone) list.splice(i, 1);
}
// Sprechblasen (Block 55): selten (alle 20–30 s) sagt jemand im Bild etwas – zu seinen Wünschen, wohin er geht, zur Tageszeit
const WISH_SAY = { weg: 'Ein Weg vor meiner Tür wäre schön …', deko: 'Ein paar Blumen vorm Haus – das wär’s!', baecker: 'Frische Brötchen! Gibt’s hier keine Bäckerei?',
  ruhe: 'Puh, ist das laut hier …', markt: 'Ich vermisse einen Marktplatz.', park: 'Ein Park zum Spazieren, das wär schön.', laden: 'Wo kann man hier bloß einkaufen?',
  schule: 'Die Kleinen bräuchten eine Schule.', schoen: 'Hier dürfte es noch etwas schöner sein.', cafe: 'Ein Café um die Ecke … hach.',
  wasser: 'Ich träume vom Blick aufs Wasser.', kultur: 'Mal wieder ins Theater – oder ins Kino?' };
const GOAL_SAY = { arbeit: ['Auf zur Arbeit!', 'Heute wird ein fleißiger Tag.'], schule: ['Ab in die Schule!', 'Heute lerne ich was Neues.'],
  essen: ['Mittagspause! ☕', 'Ich hab so einen Hunger …'], laden: ['Nur kurz was einkaufen.', 'Mal sehen, was es Neues gibt.'], markt: ['Auf zum Markt!', 'Hoffentlich gibt’s frische Äpfel.'],
  park: ['Herrlicher Abend für einen Spaziergang.', 'Gleich setz ich mich auf eine Bank.'], fzpark: ['Auf in den Freizeitpark!', 'Heute fahr ich Achterbahn!', 'Erst Zuckerwatte, dann Karussell.'], home: ['Feierabend!', 'Schön, gleich zu Hause zu sein.'],
  bummel: ['Was für ein schöner Tag.', 'Einfach mal treiben lassen …'] };
const PART_SAY = { morgen: ['Guten Morgen!', 'Die Sonne ist schon wach.'], mittag: ['Was für ein schöner Tag.'], abend: ['Der Himmel wird ganz rosa …'],
  nacht: ['Gute Nacht!', 'Die Laternen leuchten so schön ✨'] };
let bubble = null, bubbleNext = 0;
function bubbleText(w) {
  const pool = [], t = w.home && state.tiles.get(w.home), s = w.home && T.st.get(w.home);
  if (t && t.b === 'haus' && s && s.wish) {
    const miss = (s.wish.list || []).filter(v => !v.ok && WISH_SAY[v.id]);
    if (miss.length) pool.push(...miss.map(v => WISH_SAY[v.id]), ...miss.map(v => WISH_SAY[v.id]));   // Wünsche doppelt so oft
    else if (!s.wish.next) pool.push('Ich wohne hier so gern! ♥', 'Schönstes Haus der Insel! ♥');
  }
  pool.push(...(GOAL_SAY[w.goal && w.goal.kind] || []), ...PART_SAY[dayPart()]);
  return pool[Math.floor(Math.random() * pool.length)];
}
function speak(w, text, now = performance.now()) { bubble = { w, text, until: now + Math.max(5000, String(text).length * 90) }; }
function bubbleTick(now) {
  if (bubble && (now > bubble.until || bubble.w.gone || bubble.w.inside > 0)) bubble = null;
  if (bubble || now < bubbleNext) return;
  bubbleNext = now + 20e3 + Math.random() * 10e3;
  const seen = walkers.concat(strollers).filter(w => { if (w.inside > 0 || !w.home) return false; const p = toScreen(w.px, w.py); return p.x > 40 && p.x < W - 40 && p.y > 80 && p.y < H - 80; });
  if (seen.length) { const w = seen[Math.floor(Math.random() * seen.length)]; speak(w, bubbleText(w), now); }
}
// Kopf der Figur auf dem Bildschirm (wie drawWalker)
function walkerHead(w, z) {
  const p = toScreen(w.px, w.py);
  return [p.x + (w.sit ? 0 : 6 * z), p.y - (ANIMALS[w.kind] && ANIMALS[w.kind].id === 'giraffe' ? 19 : 13) * z];
}
function drawBubble(z) {
  if (!bubble || bubble.w.gone || bubble.w.inside > 0) return;
  const [hx, hy] = walkerHead(bubble.w, z), size = Math.max(11, Math.min(15, 11 * z));
  g.font = `800 ${size}px Nunito, system-ui, sans-serif`;
  // lange Sätze umbrechen (Tipps der eigenen Figur, Block 97)
  const maxW = Math.min(W - 40, 280), lines = [];
  for (const word of String(bubble.text).split(' ')) {
    const last = lines[lines.length - 1];
    if (last != null && g.measureText(last + ' ' + word).width <= maxW) lines[lines.length - 1] = last + ' ' + word; else lines.push(word);
  }
  const tw = Math.max(...lines.map(l => g.measureText(l).width)), lh = size * 1.25, w = tw + size * 1.4, h = size * 0.75 + lines.length * lh;
  const bx = Math.max(8, Math.min(W - w - 8, hx - w / 2)), by = hy - (bubble.w.label ? (bubble.w.hand === 'ballon' || bubble.w.hand === 'herzballon' ? 21 : bubble.w.hat ? 18 : 14) : 8) * z - h;   // über dem Namensschild
  g.fillStyle = 'rgba(107,79,58,0.18)'; g.beginPath(); g.roundRect(bx, by + 2, w, h, Math.min(h / 2, size)); g.fill();
  g.fillStyle = '#fffdf6'; g.beginPath(); g.roundRect(bx, by, w, h, Math.min(h / 2, size)); g.fill();
  g.beginPath(); g.moveTo(hx - 4, by + h - 1); g.lineTo(hx + 4, by + h - 1); g.lineTo(hx, by + h + 6); g.fill();
  g.strokeStyle = 'rgba(107,79,58,0.35)'; g.lineWidth = 1; g.beginPath(); g.roundRect(bx, by, w, h, Math.min(h / 2, size)); g.stroke();
  g.fillStyle = '#6b4f3a'; g.textBaseline = 'middle'; g.textAlign = 'left';
  lines.forEach((l, i) => g.fillText(l, bx + size * 0.7, by + size * 0.375 + lh * (i + 0.5)));
}
// Angetippte Figur (nur Bewohner mit Haus): die nächste in der Nähe des Fingers
function walkerAt(sx, sy) {
  const z = cam.z;
  let best = null, bd = 4 + 8 * z;                                       // so groß wie die Figur – weit weg nicht aus Versehen
  for (const w of walkers.concat(strollers)) {
    if (w.inside > 0 || !w.home || !state.tiles.get(w.home)) continue;
    const [hx, hy] = walkerHead(w, z), d = Math.hypot(sx - hx, sy - (hy + 6 * z));
    if (d < bd) { bd = d; best = w; }
  }
  return best;
}
// Was macht die Figur gerade?
const GOAL_DO = { arbeit: '💼 Auf dem Weg zur Arbeit', schule: '🎒 Auf dem Weg zur Schule', essen: '☕ Geht etwas essen', laden: '🛍️ Geht einkaufen',
  markt: '🧺 Geht zum Markt', park: '🌳 Geht in den Park', fzpark: '🎢 Geht in den Freizeitpark', home: '🏠 Auf dem Heimweg', bummel: '🚶 Bummelt ein bisschen herum' };
const GOAL_IN = { arbeit: '💼 Arbeitet gerade', schule: '🎒 Lernt gerade', essen: '☕ Macht Pause', laden: '🛍️ Kauft gerade ein', markt: '🧺 Auf dem Markt' };
function walkerDoing(w) {
  if (w.stroll) return w.sit ? '🪑 Sitzt auf einer Bank im Park' : '🌳 Spaziert durch den Park';
  const g0 = w.goal || { kind: 'bummel' }, t = g0.k && state.tiles.get(g0.k);
  if (g0.kind === 'park' && g0.there) return '🌳 Spaziert durch den Park';
  if (g0.kind === 'fzpark' && g0.there) return '🎢 Hat Spaß im Freizeitpark';
  if (w.inside > 0 && t && GOAL_IN[g0.kind]) return `${GOAL_IN[g0.kind]}: ${stageName(t)}`;
  return GOAL_DO[g0.kind] + (t && !['home', 'park', 'fzpark'].includes(g0.kind) ? ` (${stageName(t)})` : '');
}
const bar = (x, y, w, h, c) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c);
function drawWalker(w, z, now) {
  if (w.inside > 0) return;                                              // gerade im Gebäude
  const p = toScreen(w.px, w.py);
  const bob = w.wait > 0 ? (w.sit ? -2.5 * z : 0) : Math.abs(Math.sin(now / 150 + w.speed * 10)) * 1.6 * z;   // sitzend etwas tiefer
  // auf einer Bogenbrücke geht es hoch und wieder runter
  const arch = archAt(w.px, w.py), lift = arch ? archH(arch.b) * z : 0;
  const x = p.x + (w.sit ? 0 : 6 * z), y = p.y - bob - 2 * z - lift;          // auf der Bank genau an ihrem Platz
  const sp = (ANIMALS[w.kind] || ANIMALS[0]).id, f = w.fur, dark = shade(f, -0.25);
  ellipse(x, p.y - 1 * z, 4.5 * z, 2 * z, 'rgba(40,60,20,0.2)');
  if (sp === 'eichhorn') { ellipse(x + 4.2 * z, y - 9 * z, 2.8 * z, 5.5 * z, f); ellipse(x + 4.6 * z, y - 12 * z, 1.6 * z, 2.6 * z, shade(f, 0.15)); }   // buschiger Schwanz
  if (w.body === 'umhang' || w.body === 'rucksack') drawWearBack(x, y, z, w);   // hinter dem Körper (Block 97)
  ellipse(x, y - 4 * z, 3.6 * z, 4 * z, w.shirt);
  let hy = y - 11 * z;
  if (sp === 'giraffe') { bar(x - 1.6 * z, hy - 4 * z, 3.2 * z, 8 * z, f); circle(x - 0.4 * z, hy + 1 * z, 0.7 * z, '#b5763a'); circle(x + 0.7 * z, hy - 2 * z, 0.6 * z, '#b5763a'); hy -= 6 * z; }   // langer Hals
  const ears = {
    katze: () => { poly([[x - 4.5 * z, hy - 2 * z], [x - 3.5 * z, hy - 7.5 * z], [x - 0.8 * z, hy - 4 * z]], f); poly([[x + 4.5 * z, hy - 2 * z], [x + 3.5 * z, hy - 7.5 * z], [x + 0.8 * z, hy - 4 * z]], f); },
    baer: () => { circle(x - 3.8 * z, hy - 3.8 * z, 2 * z, f); circle(x + 3.8 * z, hy - 3.8 * z, 2 * z, f); },
    hase: () => { ellipse(x - 2 * z, hy - 7 * z, 1.4 * z, 4 * z, f); ellipse(x + 2 * z, hy - 7 * z, 1.4 * z, 4 * z, f); },
    eichhorn: () => { poly([[x - 4 * z, hy - 2.5 * z], [x - 3.3 * z, hy - 8 * z], [x - 1.2 * z, hy - 4 * z]], f); poly([[x + 4 * z, hy - 2.5 * z], [x + 3.3 * z, hy - 8 * z], [x + 1.2 * z, hy - 4 * z]], f); },
    fuchs: () => {
      poly([[x - 4.8 * z, hy - 1.5 * z], [x - 4.2 * z, hy - 9 * z], [x - 0.6 * z, hy - 4 * z]], f); poly([[x + 4.8 * z, hy - 1.5 * z], [x + 4.2 * z, hy - 9 * z], [x + 0.6 * z, hy - 4 * z]], f);
      poly([[x - 4.5 * z, hy - 6.5 * z], [x - 4.2 * z, hy - 9 * z], [x - 3 * z, hy - 6.8 * z]], '#4a3328'); poly([[x + 4.5 * z, hy - 6.5 * z], [x + 4.2 * z, hy - 9 * z], [x + 3 * z, hy - 6.8 * z]], '#4a3328');
    },
    igel: () => {                                                          // Stacheln rund um den Kopf
      const pts = [];
      for (let i = 0; i <= 14; i++) { const a = Math.PI * (0.95 + i / 14 * 1.1), r = (i % 2 ? 4.6 : 7.2) * z; pts.push([x + Math.cos(a) * r, hy + 0.8 * z + Math.sin(a) * r]); }
      poly([[x - 5 * z, hy + 1.5 * z], ...pts, [x + 5 * z, hy + 1.5 * z]], '#7a5536');
    },
    giraffe: () => { for (const s of [-1, 1]) { bar(x + s * 1.8 * z - 0.4 * z, hy - 7 * z, 0.8 * z, 3.5 * z, dark); circle(x + s * 1.8 * z, hy - 7 * z, 0.9 * z, '#8a5a2e'); }
      ellipse(x - 4.6 * z, hy - 1.5 * z, 1.8 * z, 0.9 * z, f); ellipse(x + 4.6 * z, hy - 1.5 * z, 1.8 * z, 0.9 * z, f); },
    elefant: () => { ellipse(x - 4.8 * z, hy, 3.4 * z, 4.4 * z, dark); ellipse(x + 4.8 * z, hy, 3.4 * z, 4.4 * z, dark); ellipse(x - 4.5 * z, hy, 2.3 * z, 3.2 * z, shade(f, 0.12)); ellipse(x + 4.5 * z, hy, 2.3 * z, 3.2 * z, shade(f, 0.12)); },
    ente: () => { ellipse(x + 0.6 * z, hy - 4.8 * z, 0.9 * z, 1.6 * z, f); },
  };
  (ears[sp] || ears.katze)();
  circle(x, hy, 4.8 * z, f);
  if (sp === 'igel') { poly([[x - 4.6 * z, hy - 0.5 * z], [x - 2 * z, hy - 4.2 * z], [x + 2 * z, hy - 4.2 * z], [x + 4.6 * z, hy - 0.5 * z], [x, hy - 2.4 * z]], '#7a5536'); }
  if (sp === 'giraffe') { circle(x - 2.2 * z, hy - 2.8 * z, 0.8 * z, '#c98a3e'); circle(x + 2.6 * z, hy - 1.6 * z, 0.6 * z, '#c98a3e'); }
  circle(x - 1.7 * z, hy - 0.3 * z, 0.7 * z, '#3d2c22'); circle(x + 1.7 * z, hy - 0.3 * z, 0.7 * z, '#3d2c22');
  if (sp === 'fuchs') { ellipse(x, hy + 2.4 * z, 2.6 * z, 1.8 * z, '#fff6ea'); circle(x, hy + 1.5 * z, 0.7 * z, '#3d2c22'); }
  else if (sp === 'igel') circle(x, hy + 1.6 * z, 0.8 * z, '#3d2c22');
  else if (sp === 'ente') ellipse(x, hy + 2 * z, 2.6 * z, 1.1 * z, '#f2a03a');
  else if (sp === 'elefant') { ellipse(x, hy + 3.6 * z, 1.3 * z, 3 * z, f); circle(x, hy + 6.2 * z, 1 * z, dark); }
  if (w.face || w.hat || w.body || w.hand) drawWear(x, hy, z, w, y, now);   // eigene Figur (Block 96c/97): Brille, Hut, Schal, Ballon …
  if (w.flag) {                                                          // Parade: Fähnchen über dem Kopf
    const wave = Math.sin(now / 250 + w.speed * 20) * 1.2 * z;
    g.strokeStyle = C('#8a5a3c'); g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(x + 4 * z, y - 2 * z); g.lineTo(x + 4 * z, hy - 12 * z); g.stroke();
    poly([[x + 4 * z, hy - 12 * z], [x + 10 * z, hy - 10.5 * z + wave], [x + 4 * z, hy - 9 * z]], C(w.flag));
  }
  if (sp !== 'ente' && sp !== 'elefant') {
    ellipse(x - 2.9 * z, hy + 1.4 * z, 1 * z, 0.6 * z, 'rgba(255,120,120,0.45)');
    ellipse(x + 2.9 * z, hy + 1.4 * z, 1 * z, 0.6 * z, 'rgba(255,120,120,0.45)');
  }
  if (w.label) {                                                         // Besucher (Block 96): Namensschild über dem Kopf
    g.font = `800 ${Math.max(9, 5 * z)}px Nunito, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(w.label).width + 8 * z, ly = hy - (w.hand === 'ballon' || w.hand === 'herzballon' ? 19 : w.hat ? 16 : 12) * z;   // über Hut und Ballon
    g.beginPath(); g.roundRect(x - tw / 2, ly - 4 * z, tw, 8 * z, 4 * z); g.fillStyle = 'rgba(255,250,240,0.92)'; g.fill();
    g.fillStyle = C('#6b4f3a'); g.fillText(w.label, x, ly + 0.3 * z);
  }
}
// Kleiderschrank der Spielfigur (Block 96c/97): Kopf (hat), Gesicht (face), Körper (body), Hand (hand).
// Kopfmitte (x, hy), Radius ≈ 4,8·z; Körper-Ellipse um (x, y − 4·z). Was man freischalten muss, steht in me.js (WEAR_NEED).
const WEAR = {
  hat: { strohhut: 'Strohhut', muetze: 'Mütze', blume: 'Blume', schleife: 'Schleife', blumenkranz: 'Blumenkranz', kochmuetze: 'Kochmütze',
    bauhelm: 'Bauhelm', piratenhut: 'Piratenhut', wikingerhelm: 'Wikingerhelm', zylinder: 'Zylinder', krone: 'Krone' },
  face: { brille: 'Brille', sonne: 'Sonnenbrille' },
  body: { schal: 'Schal', fliege: 'Fliege', rucksack: 'Rucksack', umhang: 'Umhang', band: 'Freundschaftsband' },
  hand: { ballon: 'Ballon', eis: 'Eistüte', strauss: 'Blumenstrauß', laterne: 'Laterne', herzballon: 'Herzballon' },
};
const WEAR_HATS = WEAR.hat, WEAR_FACES = WEAR.face;
// Kuppel (Helme): obere Hälfte einer Ellipse
const wearDome = (cx, cy, rx, ry, col) => poly(Array.from({ length: 13 }, (_, i) => { const a = Math.PI + i / 12 * Math.PI; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }), col);
// zweite Farbe, die sich vom Shirt abhebt
const wearAccent = w => SHIRTS[(Math.max(0, SHIRTS.indexOf(w.shirt)) + 2) % SHIRTS.length];
function drawWearBack(x, y, z, w) {
  if (w.body === 'umhang') poly([[x - 3.2 * z, y - 7.6 * z], [x + 3.2 * z, y - 7.6 * z], [x + 5.6 * z, y + 0.6 * z], [x - 5.6 * z, y + 0.6 * z]], C('#c8414f'));
  if (w.body === 'rucksack') { const r = 1.4 * z; g.fillStyle = C('#b5763a'); g.beginPath(); g.roundRect(x - 4.6 * z, y - 9 * z, 9.2 * z, 7 * z, r); g.fill(); bar(x - 4.6 * z, y - 7.2 * z, 9.2 * z, 0.8 * z, C('#8a5a2e')); }
}
function drawWear(x, hy, z, w, y = hy + 11 * z, now = 0) {
  // Körper vorn (unterm Kinn, nach dem Kopf gezeichnet)
  if (w.body === 'schal') { const c = wearAccent(w); ellipse(x, y - 5.6 * z, 4 * z, 1.3 * z, C(c)); bar(x + 1 * z, y - 5.6 * z, 1.5 * z, 3.8 * z, C(c)); bar(x + 1 * z, y - 2.8 * z, 1.5 * z, 0.5 * z, C('#fffaf0')); }
  else if (w.body === 'fliege') { const c = w.shirt === SHIRTS[0] ? '#2e2e38' : '#e8604f'; poly([[x, y - 5.4 * z], [x - 2.2 * z, y - 6.5 * z], [x - 2.2 * z, y - 4.3 * z]], C(c)); poly([[x, y - 5.4 * z], [x + 2.2 * z, y - 6.5 * z], [x + 2.2 * z, y - 4.3 * z]], C(c)); circle(x, y - 5.4 * z, 0.6 * z, C(shade(c, -0.2))); }
  else if (w.body === 'rucksack') { bar(x - 2.6 * z, y - 6.2 * z, 0.9 * z, 5 * z, C('#8a5a2e')); bar(x + 1.7 * z, y - 6.2 * z, 0.9 * z, 5 * z, C('#8a5a2e')); }
  else if (w.body === 'umhang') circle(x, y - 5.8 * z, 0.9 * z, C('#f2c14e'));
  else if (w.body === 'band') {                                          // Freundschaftsband: bunte Schärpe mit Herz (Block 105)
    poly([[x - 3.2 * z, y - 6.4 * z], [x - 2 * z, y - 7 * z], [x + 3.4 * z, y - 1.2 * z], [x + 2.2 * z, y - 0.6 * z]], C('#f28cb1'));
    for (const [k, c] of [[0.25, '#ffd23f'], [0.55, '#5f8fe8'], [0.85, '#58b36a']]) circle(x - 2.6 * z + k * 5.6 * z, y - 6.7 * z + k * 5.8 * z, 0.45 * z, C(c));
    const hx0 = x + 0.3 * z, hy0 = y - 3.8 * z;
    circle(hx0 - 0.5 * z, hy0 - 0.3 * z, 0.7 * z, C('#e8604f')); circle(hx0 + 0.5 * z, hy0 - 0.3 * z, 0.7 * z, C('#e8604f'));
    poly([[hx0 - 1.15 * z, hy0 - 0.1 * z], [hx0 + 1.15 * z, hy0 - 0.1 * z], [hx0, hy0 + 1.1 * z]], C('#e8604f'));
  }
  // Hand (rechts)
  if (w.hand) {
    const hx = x + 3.9 * z, hy2 = y - 3.6 * z;
    if (w.hand === 'herzballon') {                                     // Herzballon (Block 105)
      const sway = Math.sin(now / 700 + (w.speed || 0) * 10) * 0.8 * z, bx = x + 6.6 * z + sway, by = hy - 10 * z;
      g.strokeStyle = C('#8a7a6a'); g.lineWidth = 0.4 * z; g.beginPath(); g.moveTo(hx, hy2); g.quadraticCurveTo(x + 6 * z, hy - 2 * z, bx, by + 3.2 * z); g.stroke();
      circle(bx - 1.3 * z, by - 0.8 * z, 1.8 * z, C('#e8604f')); circle(bx + 1.3 * z, by - 0.8 * z, 1.8 * z, C('#e8604f'));
      poly([[bx - 3 * z, by - 0.3 * z], [bx + 3 * z, by - 0.3 * z], [bx, by + 3.4 * z]], C('#e8604f'));
      ellipse(bx - 1.6 * z, by - 1.4 * z, 0.5 * z, 0.7 * z, 'rgba(255,255,255,0.55)');
    } else if (w.hand === 'ballon') {
      const sway = Math.sin(now / 700 + (w.speed || 0) * 10) * 0.8 * z, bx = x + 6.6 * z + sway, by = hy - 10 * z;
      g.strokeStyle = C('#8a7a6a'); g.lineWidth = 0.4 * z; g.beginPath(); g.moveTo(hx, hy2); g.quadraticCurveTo(x + 6 * z, hy - 2 * z, bx, by + 3.2 * z); g.stroke();
      ellipse(bx, by, 2.6 * z, 3.2 * z, C(wearAccent(w))); ellipse(bx - 0.9 * z, by - 1.1 * z, 0.6 * z, 0.9 * z, 'rgba(255,255,255,0.55)');
      poly([[bx - 0.5 * z, by + 3.5 * z], [bx + 0.5 * z, by + 3.5 * z], [bx, by + 2.9 * z]], C(wearAccent(w)));
    } else if (w.hand === 'eis') {
      poly([[hx - 1.1 * z, hy2 - 1.6 * z], [hx + 1.1 * z, hy2 - 1.6 * z], [hx, hy2 + 1.8 * z]], C('#e0a35a'));
      circle(hx, hy2 - 2.4 * z, 1.4 * z, C('#f6a5c0')); circle(hx - 0.4 * z, hy2 - 2.9 * z, 0.4 * z, 'rgba(255,255,255,0.6)');
    } else if (w.hand === 'strauss') {
      g.strokeStyle = C('#58a35a'); g.lineWidth = 0.5 * z; g.beginPath();
      for (const dx of [-1, 0, 1]) { g.moveTo(hx, hy2 + 0.6 * z); g.lineTo(hx + dx * 1.1 * z, hy2 - 2.6 * z); } g.stroke();
      [['#f28cb1', -1.1], ['#ffd23f', 0], ['#b07ad6', 1.1]].forEach(([c, dx], i) => circle(hx + dx * z, hy2 - (2.8 + (i % 2) * 0.6) * z, 0.9 * z, C(c)));
    } else if (w.hand === 'laterne') {
      g.strokeStyle = C('#5a4636'); g.lineWidth = 0.4 * z; g.beginPath(); g.moveTo(hx, hy2); g.lineTo(hx, hy2 + 1 * z); g.stroke();
      ellipse(hx, hy2 + 2.4 * z, 3 * z, 3 * z, 'rgba(255,214,110,0.22)');                 // Schein
      bar(hx - 0.9 * z, hy2 + 1 * z, 1.8 * z, 2.6 * z, C('#ffd66e')); bar(hx - 1.1 * z, hy2 + 0.8 * z, 2.2 * z, 0.5 * z, C('#5a4636')); bar(hx - 1.1 * z, hy2 + 3.5 * z, 2.2 * z, 0.5 * z, C('#5a4636'));
    }
    circle(hx, hy2, 1 * z, w.fur);                                                       // Pfote hält es
  }
  if (w.face === 'brille' || w.face === 'sonne') {
    const dark = w.face === 'sonne';
    for (const s of [-1, 1]) { if (dark) ellipse(x + s * 1.9 * z, hy - 0.2 * z, 1.5 * z, 1.1 * z, '#2e2e38'); else { g.strokeStyle = C('#3d2c22'); g.lineWidth = 0.6 * z; g.beginPath(); g.arc(x + s * 1.9 * z, hy - 0.2 * z, 1.4 * z, 0, Math.PI * 2); g.stroke(); } }
    g.strokeStyle = C(dark ? '#2e2e38' : '#3d2c22'); g.lineWidth = 0.5 * z; g.beginPath(); g.moveTo(x - 0.5 * z, hy - 0.4 * z); g.lineTo(x + 0.5 * z, hy - 0.4 * z); g.stroke();
  }
  const top = hy - 4.4 * z;
  if (w.hat === 'strohhut') { ellipse(x, top + 0.6 * z, 6.6 * z, 1.8 * z, C('#e9c46a')); ellipse(x, top - 1.2 * z, 3.4 * z, 2.4 * z, C('#f0d27e')); bar(x - 3.3 * z, top - 0.4 * z, 6.6 * z, 0.9 * z, C('#e8604f')); }
  else if (w.hat === 'muetze') { poly([[x - 4.6 * z, top + 1.2 * z], [x - 3.2 * z, top - 3.4 * z], [x + 3.2 * z, top - 3.4 * z], [x + 4.6 * z, top + 1.2 * z]], C(w.shirt || '#e8604f')); bar(x - 4.8 * z, top + 0.4 * z, 9.6 * z, 1.6 * z, C('#fffaf0')); circle(x, top - 4.2 * z, 1.5 * z, C('#fffaf0')); }
  else if (w.hat === 'krone') { poly([[x - 3.6 * z, top + 0.8 * z], [x - 3.6 * z, top - 2.6 * z], [x - 1.8 * z, top - 0.8 * z], [x, top - 3.4 * z], [x + 1.8 * z, top - 0.8 * z], [x + 3.6 * z, top - 2.6 * z], [x + 3.6 * z, top + 0.8 * z]], C('#f2c14e')); circle(x, top - 0.4 * z, 0.7 * z, C('#e8604f')); }
  else if (w.hat === 'blume') { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; circle(x + 3.2 * z + Math.cos(a) * 1.3 * z, top + 0.6 * z + Math.sin(a) * 1.3 * z, 1 * z, C('#f28cb1')); } circle(x + 3.2 * z, top + 0.6 * z, 0.8 * z, C('#ffd23f')); }
  else if (w.hat === 'schleife') { poly([[x + 2.6 * z, top + 0.8 * z], [x + 0.4 * z, top - 1.2 * z], [x + 0.4 * z, top + 2.4 * z]], C('#f28cb1')); poly([[x + 2.6 * z, top + 0.8 * z], [x + 4.8 * z, top - 1.2 * z], [x + 4.8 * z, top + 2.4 * z]], C('#f28cb1')); circle(x + 2.6 * z, top + 0.8 * z, 0.8 * z, C('#e86a9a')); }
  else if (w.hat === 'zylinder') { ellipse(x, top + 0.8 * z, 5.6 * z, 1.4 * z, C('#2e2e38')); bar(x - 3 * z, top - 5 * z, 6 * z, 5.8 * z, C('#2e2e38')); bar(x - 3 * z, top - 0.8 * z, 6 * z, 1 * z, C('#e8604f')); }
  else if (w.hat === 'blumenkranz') {
    g.strokeStyle = C('#58a35a'); g.lineWidth = 0.9 * z; g.beginPath(); g.ellipse(x, top + 1.4 * z, 4.6 * z, 1.5 * z, 0, 0, Math.PI * 2); g.stroke();
    const cols = ['#f28cb1', '#ffd23f', '#fffaf0', '#b07ad6'];
    for (let i = 0; i < 7; i++) { const a = 0.08 * Math.PI + i / 6 * 0.84 * Math.PI; circle(x + Math.cos(a) * 4.6 * z, top + 1.4 * z + Math.sin(a) * 1.5 * z, 0.95 * z, C(cols[i % 4])); }
  }
  else if (w.hat === 'kochmuetze') {
    for (const [dx, dy, r] of [[-2.1, -3.2, 2.2], [2.1, -3.2, 2.2], [0, -4.4, 2.6]]) circle(x + dx * z, top + dy * z, r * z, C('#fffaf0'));
    bar(x - 3.3 * z, top - 2.4 * z, 6.6 * z, 3.4 * z, C('#fffaf0')); bar(x - 3.3 * z, top + 0.2 * z, 6.6 * z, 0.8 * z, C('#e6dccb'));
  }
  else if (w.hat === 'bauhelm') { wearDome(x, top + 1.6 * z, 4.6 * z, 4.4 * z, C('#f2c14e')); ellipse(x, top + 1.6 * z, 5.8 * z, 1.1 * z, C('#e0a92e')); bar(x - 0.5 * z, top - 2.7 * z, 1 * z, 4.2 * z, C('#f8d872')); }
  else if (w.hat === 'piratenhut') {
    poly([[x - 6.2 * z, top + 1.2 * z], [x - 3.4 * z, top - 3.4 * z], [x, top - 1.8 * z], [x + 3.4 * z, top - 3.4 * z], [x + 6.2 * z, top + 1.2 * z], [x, top + 0.4 * z]], C('#2e2e38'));
    circle(x, top - 0.6 * z, 0.9 * z, C('#fffaf0')); bar(x - 0.5 * z, top + 0.1 * z, 1 * z, 0.4 * z, C('#fffaf0'));
  }
  else if (w.hat === 'wikingerhelm') {
    for (const s of [-1, 1]) poly([[x + s * 3.8 * z, top + 0.4 * z], [x + s * 6.6 * z, top - 1.6 * z], [x + s * 7 * z, top - 4.4 * z], [x + s * 5.4 * z, top - 1.2 * z], [x + s * 3.4 * z, top - 1.2 * z]], C('#fffaf0'));
    wearDome(x, top + 1.6 * z, 4.6 * z, 4.4 * z, C('#b9b9c6')); bar(x - 4.6 * z, top + 0.6 * z, 9.2 * z, 1.1 * z, C('#8f8f9e'));
  }
}
function drawCar(c, z) {
  const p = toScreen(c.px, c.py);
  if (c.bus) {
    const bx = box(p.x, p.y, 9 * z, 4.5 * z, 8 * z, '#ffd23f', null, 0);
    faceQuad(bx.L, bx.B, 0.1, 0.9, 4 * z, 7 * z, '#bfe3ff');
    faceQuad(bx.B, bx.R, 0.15, 0.85, 4 * z, 7 * z, '#a9d3f2');
  } else {
    const bx = box(p.x, p.y, 5.5 * z, 2.8 * z, 3.5 * z, c.col, null, 0);
    box(p.x, p.y - 3.5 * z, 3.3 * z, 1.7 * z, 2.5 * z, '#dff1ff', null, 0);
    void bx;
  }
}

// ---------------------------------------------------------------------------
// Züge: Auf einer Strecke pendelt einer zwischen den Bahnhöfen und hält an jedem kurz; auf einem Rundkurs fahren
// alle im Kreis, gleichmäßig verteilt. Ohne Strom steht der Zug. Modell und Farbe wählt der Spieler am Bahnhof.
// ---------------------------------------------------------------------------
const trains = [];
const TRAIN_SPEED = 1.6, TRAIN_WAIT = 2.5;
const TRAIN_KIND = {
  regio:  { n: 2, len: 0.78, gap: 0.06, h: 12 },
  tram:   { n: 1, len: 1.0, gap: 0, h: 13 },
  modern: { n: 3, len: 0.6, gap: 0.04, h: 11 },
  schnell: { n: 4, len: 0.62, gap: 0.03, h: 10 },
};
const trainSpeed = model => TRAIN_SPEED * (TRAIN_BY_ID[model] || TRAIN_BY_ID.tram).speed;   // schnellere Modelle fahren schneller
// Schienenfeld direkt am Bahnhof (dort hält der Zug)
function railStop(k) {
  for (const [fx, fy] of stopFoot(k)) for (const [dx, dy] of DIRS) {
    const n = (fx + dx) + ',' + (fy + dy);
    if (T.rail.comp.has(n)) return n;
  }
  return null;
}
// kürzester Weg über Schienen (Liste von Feldern), null wenn keiner
function railPath(from, to) {
  const prev = new Map([[from, null]]), q = [from];
  for (let i = 0; i < q.length; i++) {
    const k = q[i];
    if (k === to) break;
    const [x, y] = keyXY(k);
    for (const [dx, dy] of DIRS) {
      const n = (x + dx) + ',' + (y + dy);
      if (!prev.has(n) && bAt(x + dx, y + dy) === 'schiene') { prev.set(n, k); q.push(n); }
    }
  }
  if (!prev.has(to)) return null;
  const out = [];
  for (let k = to; k; k = prev.get(k)) out.push(k);
  return out.reverse();
}
// Punkte in Feld-Koordinaten entlang einer Feldfolge; in Kurven ein Bogen um die gemeinsame Ecke.
// closed: Ring – das letzte Feld hängt wieder am ersten
function railPolyline(keys, closed = false) {
  const P = keys.map(keyXY), pts = [], n = P.length;
  for (let i = 0; i < n; i++) {
    const [x, y] = P[i];
    const pv = closed ? P[(i - 1 + n) % n] : P[i - 1], nx = closed ? P[(i + 1) % n] : P[i + 1];
    const din = pv ? [x - pv[0], y - pv[1]] : nx ? [nx[0] - x, nx[1] - y] : [1, 0];
    const dout = nx ? [nx[0] - x, nx[1] - y] : din;
    if ((!closed && (i === 0 || i === n - 1)) || (din[0] === dout[0] && din[1] === dout[1])) { pts.push([x, y]); continue; }
    const ein = [-din[0] * 0.5, -din[1] * 0.5], eout = [dout[0] * 0.5, dout[1] * 0.5], c = [ein[0] + eout[0], ein[1] + eout[1]];
    const a0 = Math.atan2(ein[1] - c[1], ein[0] - c[0]), a1 = sweep(a0, Math.atan2(eout[1] - c[1], eout[0] - c[0]));
    for (const [u, v] of arcPts(c[0], c[1], 0.5, a0, a1, 6)) pts.push([x + u, y + v]);
  }
  if (closed) pts.push([...pts[0]]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1], loop: closed };
}
// Ort und Fahrtrichtung bei Strecke d
function railPoint(route, d) {
  const { pts, cum } = route;
  if (pts.length === 1) return [pts[0][0], pts[0][1], 1, 0];
  d = route.loop ? ((d % route.len) + route.len) % route.len : Math.max(0, Math.min(route.len, d));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const a = pts[i - 1], b = pts[i], seg = cum[i] - cum[i - 1] || 1, f = (d - cum[i - 1]) / seg;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (b[0] - a[0]) / seg, (b[1] - a[1]) / seg];
}
// Route einer Linie: Bahnhöfe nach Entfernung vom ersten ordnen, Wege aneinanderhängen, Halte merken
function lineRoute(line) {
  if (line.loop) return loopRoute(line);
  const stops = line.stations.map(railStop).filter(Boolean);
  if (stops.length < 2) return null;
  const first = stops[0], dist = k => (railPath(first, k) || []).length;
  const order = [...new Set(stops)].sort((a, b) => dist(a) - dist(b));
  let keys = [order[0]];
  for (let i = 1; i < order.length; i++) {
    const p = railPath(order[i - 1], order[i]);
    if (!p) return null;
    keys = keys.concat(p.slice(1));
  }
  // an beiden Enden bis zu 2 Felder geradeaus weiter, damit der Zug mittig am Bahnsteig halten kann
  // (am Hauptbahnhof bis ans Ende der Halle)
  const extend = (list, atEnd) => {
    for (let n = 0; n < 3 && list.length > 1; n++) {
      const [a, b] = atEnd ? [list[list.length - 2], list[list.length - 1]] : [list[1], list[0]];
      const [ax, ay] = keyXY(a), [bx, by] = keyXY(b), nx = 2 * bx - ax, ny = 2 * by - ay, nk = nx + ',' + ny;
      if (list.includes(nk) || (!HALL.has(nk) && (n >= 2 || bAt(nx, ny) !== 'schiene'))) break;
      if (atEnd) list.push(nk); else list.unshift(nk);
    }
  };
  extend(keys, false); extend(keys, true);
  const route = railPolyline(keys);
  const distOf = k => { const [x, y] = keyXY(k); let best = 0, bd = 1e9; route.pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = route.cum[i]; } }); return [best, bd]; };
  // Halt: Mitte aller Schienenfelder direkt am Bahnhof, die auf der Strecke liegen
  route.stops = order.map(stop => {
    const st = line.stations.find(s => railStop(s) === stop), ds = [];
    for (const [fx, fy] of stopFoot(st)) for (const [dx, dy] of DIRS) {
      const [d, off] = distOf((fx + dx) + ',' + (fy + dy));
      if (off < 0.01) ds.push(d);
    }
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : distOf(stop)[0];
  });
  return route;
}
// Halt eines Bahnhofs auf einer Route: Mitte aller Felder direkt am Bahnhof, die auf der Strecke liegen
function stopOn(route, st) {
  const ds = [];
  let best = null, bd = 0.8;                                  // sonst: nächster Punkt (Bahnhof nur an einer Kurve)
  for (const [fx, fy] of stopFoot(st)) for (const [dx, dy] of DIRS) {
    const x = fx + dx, y = fy + dy;
    route.pts.forEach((p, i) => {
      const d = Math.hypot(p[0] - x, p[1] - y);
      if (d < 0.01) ds.push(route.cum[i]);
      if (d < bd && i < route.pts.length - 1) { bd = d; best = route.cum[i]; }
    });
  }
  return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : best;
}
// Rundkurs: Ring ab einem Feld, an dem kein Bahnhof liegt (sonst läge ein Halt über dem Nahtpunkt)
function loopRoute(line) {
  const near = new Set();
  for (const st of line.stations) for (const [fx, fy] of stopFoot(st)) for (const [dx, dy] of [[0, 0], ...DIRS]) near.add((fx + dx) + ',' + (fy + dy));
  const i0 = Math.max(0, line.loop.findIndex(k => !near.has(k)));
  const route = railPolyline(line.loop.slice(i0).concat(line.loop.slice(0, i0)), true);
  route.stops = line.stations.map(st => stopOn(route, st)).filter(d => d != null).sort((a, b) => a - b);
  if (!route.stops.length) return null;
  route.lap = route.len / TRAIN_SPEED + route.stops.length * TRAIN_WAIT;
  return route;
}
// Rundkurs: Ort nach Fahrzeit tau (hält an jedem Bahnhof TRAIN_WAIT) – mehrere Züge sind zeitversetzte Kopien
function loopPos(route, tau) {
  let t = ((tau % route.lap) + route.lap) % route.lap;
  const S = route.stops;
  for (let i = 0; i < S.length; i++) {
    if (t < TRAIN_WAIT) return S[i];
    t -= TRAIN_WAIT;
    const dist = (i + 1 < S.length ? S[i + 1] : S[0] + route.len) - S[i], tt = dist / TRAIN_SPEED;
    if (t < tt) return S[i] + t * TRAIN_SPEED;
    t -= tt;
  }
  return S[0];
}
function syncTrains() {
  if (!T.rail) return;
  const looksOf = new Map(T.rail.lines.map(l => [l, lineLooks(l.stations)]));
  const sig = groundVersion + '|' + T.rail.lines.map(l => looksOf.get(l).map(lk => lk.model + lk.col + '+' + (lk.plus || 0)).join('/') + ':' + l.running).join();   // Umbau, Modell, Wagen, Strom
  if (syncTrains.sig === sig) return;
  syncTrains.sig = sig;
  const old = new Map(trains.map(tr => [tr.id, tr]));
  trains.length = 0;
  for (const line of T.rail.lines) {
    const route = lineRoute(line);
    if (!route) continue;
    const kindOf = look => ({ ...(TRAIN_KIND[look.model] || TRAIN_KIND.regio), n: carsOf(look) });     // so viele Wagen, wie dran sind
    if (route.loop) {
      // alle fahrenden Züge gleichmäßig über den Ring verteilt; ohne Strom steht einer am ersten Bahnhof
      const n = Math.max(1, line.running), prev = old.get(line.stations[0] + '#0'), ls = prev && prev.ls ? prev.ls : { tau: 0 };
      for (let i = 0; i < n; i++) {
        const look = looksOf.get(line)[i] || looksOf.get(line)[0];
        const tr = { id: line.stations[0] + '#' + i, route, loop: true, ls, idx: i, n, powered: line.running > i, model: look.model, col: look.col, kind: kindOf(look), dir: 1 };
        tr.c = loopPos(route, ls.tau + i * route.lap / n);
        trains.push(tr);
      }
      continue;
    }
    const look = looksOf.get(line)[0], kind = kindOf(look);
    const half = (kind.n * (kind.len + kind.gap)) / 2, lo = Math.min(half, route.len / 2), hi = Math.max(route.len - half, route.len / 2);
    const clampStop = d => Math.max(lo, Math.min(hi, d));
    const prev = old.get(line.stations[0]);
    const tr = { id: line.stations[0], route, stops: route.stops.map(clampStop), powered: line.powered, model: look.model, col: look.col, kind,
      c: prev && !prev.loop ? Math.max(lo, Math.min(hi, prev.c)) : clampStop(route.stops[0]), dir: prev && !prev.loop ? prev.dir : 1,
      wait: prev && !prev.loop ? prev.wait : TRAIN_WAIT, next: prev && !prev.loop ? prev.next : 1 };
    if (tr.next >= tr.stops.length || tr.next < 0) { tr.next = tr.stops.length - 1; tr.dir = 1; }
    trains.push(tr);
  }
}
function stepTrains(dt) {
  for (const tr of trains) {
    if (tr.loop) {
      if (tr.powered && tr.idx === 0) tr.ls.tau += dt * (TRAIN_BY_ID[tr.model] || TRAIN_BY_ID.tram).speed;   // die Zeit des Rings läuft einmal pro Linie
      continue;
    }
    if (!tr.powered) continue;
    if (tr.wait > 0) { tr.wait -= dt; continue; }
    const target = tr.stops[tr.next], step = trainSpeed(tr.model) * dt;
    if (Math.abs(target - tr.c) <= step) {
      tr.c = target; tr.wait = TRAIN_WAIT;
      if (tr.next + tr.dir < 0 || tr.next + tr.dir >= tr.stops.length) tr.dir = -tr.dir;
      tr.next += tr.dir;
    } else tr.c += Math.sign(target - tr.c) * step;
  }
  for (const tr of trains) if (tr.loop && tr.powered) tr.c = loopPos(tr.route, tr.ls.tau + tr.idx * tr.route.lap / tr.n);
}
// Wagen zum Zeichnen (einsortiert wie Bewohner, nach ihrem Feld)
function trainCars() {
  const out = [];
  for (const tr of trains) {
    const { n, len, gap } = tr.kind, moving = tr.loop ? 1 : Math.sign(tr.stops[tr.next] - tr.c) || tr.dir;
    for (let i = 0; i < n; i++) {
      const d = tr.c + ((n - 1) / 2 - i) * (len + gap) * moving;
      const [u, v, du, dv] = railPoint(tr.route, d);
      out.push({ train: tr, px: u, py: v, du: du * moving, dv: dv * moving, i, n, len });
    }
  }
  return out;
}
// Ein Wagen als gedrehter Quader: a entlang der Fahrtrichtung, b quer; sichtbar sind Seiten, die nach vorn-unten zeigen
function drawTrainCar(car, z, now) {
  const tr = car.train, { du, dv } = car, col = TRAIN_COLS[tr.col] || TRAIN_COLS[0], H = tr.kind.h;
  const P = (a, b, up = 0) => { const p = toScreen(car.px + du * a - dv * b, car.py + dv * a + du * b); return [p.x, p.y - up * z]; };
  const la = car.len / 2, wb = tr.model === 'tram' ? 0.19 : 0.17, lit = night > 0.15 && isLive();
  const body = tr.model === 'modern' || tr.model === 'schnell' ? '#f5f5f2' : tr.model === 'tram' ? shade(col, 0.35) : col;
  const [cx, cy] = P(0, 0);
  ellipse(cx, cy + 1 * z, (la + 0.1) * TW * 0.5 * z, (la + 0.1) * TH * 0.5 * z, 'rgba(40,50,70,0.2)');
  const C4 = [[-la, -wb], [la, -wb], [la, wb], [-la, wb]];
  const faces = [0, 1, 2, 3].map(i => {
    const [a0, b0] = C4[i], [a1, b1] = C4[(i + 1) % 4], na = (a0 + a1) / 2 / la, nb = (b0 + b1) / 2 / wb;
    const nu = du * na - dv * nb, nv = dv * na + du * nb;
    return { p: P(a0, b0), q: P(a1, b1), vis: nu + nv, nu, end: Math.abs(na) > 0.5, front: na > 0.5 };
  }).filter(f => f.vis > 0.02).sort((a, b) => a.vis - b.vis);
  for (const f of faces) {
    const wall = shade(body, f.nu > 0 ? LIGHT.side * Math.min(1, f.nu * 1.4) : 0);
    poly([f.p, f.q, [f.q[0], f.q[1] - H * z], [f.p[0], f.p[1] - H * z]], C(wall));
    if (tr.model === 'regio') faceQuad(f.p, f.q, 0, 1, H * 0.42 * z, H * 0.92 * z, C(shade('#f6ecd6', f.nu > 0 ? LIGHT.side * f.nu : 0)));
    if (tr.model === 'modern') faceQuad(f.p, f.q, 0, 1, H * 0.1 * z, H * 0.3 * z, C(col));
    if (tr.model === 'schnell') { faceQuad(f.p, f.q, 0, 1, H * 0.12 * z, H * 0.24 * z, C(col)); faceQuad(f.p, f.q, 0, 1, H * 0.86 * z, H * 0.94 * z, C(col)); }   // Zierstreifen unten und oben
    const glass = lit ? '#ffd873' : C(tr.model === 'modern' || tr.model === 'schnell' ? '#3d4a5c' : '#bfe3ff');
    if (f.end) faceQuad(f.p, f.q, 0.18, 0.82, H * 0.48 * z, H * 0.82 * z, glass);
    else {
      const w = tr.model === 'tram' ? 3 : tr.model === 'modern' || tr.model === 'schnell' ? 1 : 4;
      for (let k = 0; k < w; k++) {
        const t0 = 0.08 + k * 0.84 / w, t1 = t0 + 0.84 / w - (w > 1 ? 0.05 : 0);
        faceQuad(f.p, f.q, t0, t1, H * 0.48 * z, H * 0.82 * z, glass);
      }
    }
    if (f.end && f.front && car.i === 0) {                // Scheinwerfer vorn
      for (const t of [0.22, 0.78]) { const m = lerp(f.p, f.q, t); circle(m[0], m[1] - H * 0.22 * z, 0.9 * z, lit ? '#fff3b0' : C('#fffaf0')); }
      if (lit) { const m = lerp(f.p, f.q, 0.5); glowQuad([[m[0] - 2, m[1] - H * 0.3 * z], [m[0] + 2, m[1] - H * 0.3 * z], [m[0] + 2, m[1] - H * 0.15 * z], [m[0] - 2, m[1] - H * 0.15 * z]], 22 * z); }
    }
  }
  const roof = C4.map(([a, b]) => P(a * 0.97, b * 0.9, H));
  poly(roof, C(tr.model === 'modern' ? '#dfe3e8' : '#c9ccd4'));
  poly(C4.map(([a, b]) => P(a * 0.8, b * 0.5, H + (tr.model === 'tram' ? 1.6 : 1))), C(tr.model === 'modern' ? '#eceff2' : '#dcdfe5'));
  if (car.i === 0 || tr.model === 'tram') {             // Stromabnehmer bis zum Fahrdraht
    const [bx, by] = P(0, 0, H + 1), [tx, ty] = P(0, 0, WIRE_H), [kx, ky] = P(-0.12, 0, (H + WIRE_H) / 2 + 1);
    g.strokeStyle = C('#4f545e'); g.lineWidth = 0.8 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(bx, by); g.lineTo(kx, ky); g.lineTo(tx, ty); g.moveTo(tx - 2.5 * z, ty); g.lineTo(tx + 2.5 * z, ty); g.stroke();
  }
}

// Expedition: das Boot fährt vom Steg zur nächsten Insel, sucht dort eine Weile und kommt zurück (echte Zeit)
function expeditionBoat() {
  const e = state.expedition, i = e && ISLE_BY_ID[e.isle];
  if (!i) return null;
  const r = expeditionRoute(e.from, i);
  if (!r) return null;
  const p = Math.min(1, (Date.now() - e.t0) / Math.max(1, e.until - e.t0));
  if (p < 0.45 || p >= 0.55) {                                  // hin und zurück auf dem Seeweg
    const d = (p < 0.45 ? p / 0.45 : 1 - (p - 0.55) / 0.45) * r.len, [px, py, du, dv] = routeAt(r, d);
    return { boat: true, px, py, du: p < 0.45 ? du : -du, dv: p < 0.45 ? dv : -dv };
  }
  const [ex, ey] = r.pts[r.pts.length - 1], a = (p - 0.45) / 0.1 * Math.PI * 2;   // vor der Küste suchen (kleiner Kreis)
  return { boat: true, px: ex + Math.cos(a) * 0.8 - 0.8, py: ey + Math.sin(a) * 0.8, du: -Math.sin(a), dv: Math.cos(a) };
}
function drawBoatMover(m, z, now) {
  const p = toScreen(m.px, m.py), x = p.x, y = p.y, bob = Math.sin(now / 600) * 1.2 * z;
  const flip = (m.du - m.dv) < 0 ? -1 : 1;                                                 // Bug zeigt in Fahrtrichtung
  ellipse(x, y + 3 * z, 20 * z, 6 * z, 'rgba(230,248,255,0.45)');                         // Kielwasser
  ellipse(x, y + 2 * z + bob, 13 * z, 4.5 * z, C('#8b5a3c'));
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1.3 * z;
  g.beginPath(); g.moveTo(x, y + bob); g.lineTo(x, y - 26 * z + bob); g.stroke();
  poly([[x + flip * 1 * z, y - 24 * z + bob], [x + flip * 12 * z, y - 5 * z + bob], [x + flip * 1 * z, y - 3 * z + bob]], C('#fffaf0'));
  if (m.flag) {                                                                           // Freundesschiff (Block 105): seine Flagge am Mast
    const fw = 9 * z, fh = 6 * z, fx = flip > 0 ? x - fw : x, fy = y - 31 * z + bob;
    poly([[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]], C(m.flag.c));
    g.font = `${4.4 * z}px system-ui, sans-serif`; g.textBaseline = 'middle'; centerText(m.flag.s || '', fx + fw / 2, fy + fh / 2 + 0.3 * z);
    return;
  }
  poly([[x, y - 27 * z + bob], [x - flip * 5 * z, y - 25 * z + bob], [x, y - 23 * z + bob]], C('#e8604f'));  // Wimpel
}

// Schiffe (Block 23b): jedes pendelt zwischen dem Pier seines Hafens und seinem Ziel (Steg oder Hafen), wartet kurz
// am Anleger; Schiffe auf derselben Strecke fahren zeitversetzt. Schnellere Modelle fahren schneller.
const SHIP_SPEED = 1.4, SHIP_WAIT = 3;
function shipMovers(now) {
  const out = [];
  for (const f of T.ferries || []) {
    if (!f.route) continue;                                     // kein Seeweg: die Schiffe liegen am Pier
    const r = f.route, len = Math.max(0.1, r.len);
    f.ships.forEach((s, i) => {
      const spd = SHIP_SPEED * shipSpeed(s), leg = len / spd + SHIP_WAIT, lap = 2 * leg;
      let t = ((now / 1000) + i * lap / f.ships.length + hash(r.pts[0][0] | 0, r.pts[0][1] | 0, 9) * lap) % lap, dir = 1;
      if (t > leg) { t -= leg; dir = -1; }
      let k = Math.max(0, Math.min(1, (t - SHIP_WAIT) / (len / spd)));
      if (dir < 0) k = 1 - k;
      const [px, py, ux, uy] = routeAt(r, k * len);
      const waiting = k === 0 || k === 1, side = waiting ? (i - (f.ships.length - 1) / 2) * 1.1 : 0;   // am Anleger nebeneinander
      out.push({ boat: true, ship: s.model, px: px - uy * side, py: py + ux * side, du: ux * dir, dv: uy * dir });
    });
  }
  return out;
}
// Schiffe nach Modell: Holzfähre, Raddampfer (Schaufelrad, Schornstein), Motorfähre (zwei Decks), Katamaran (zwei Rümpfe)
function drawShipMover(m, z, now) {
  const p = toScreen(m.px, m.py), x = p.x, y = p.y, bob = Math.sin(now / 800 + m.px) * 1 * z, lit = night > 0.15 && isLive();
  const flip = (m.du - m.dv) < 0 ? -1 : 1, win = lit ? '#ffd873' : C('#3e7fd0');
  const wake = r => ellipse(x - flip * r * 0.4 * z, y + 3 * z, r * z, r * 0.3 * z, 'rgba(230,248,255,0.45)');
  if (m.ship === 'dampfer') {
    wake(28);
    ellipse(x, y + 2 * z + bob, 20 * z, 6.5 * z, C('#3a3f4a'));
    ellipse(x, y + bob, 19 * z, 5.6 * z, C('#fffaf0'));
    box(x - flip * 2 * z, y - 1 * z + bob, 20 * z, 4.5 * z, 6 * z, '#fffaf0', '#e8604f', 2 * z);
    for (let i = 0; i < 5; i++) { g.fillStyle = win; g.fillRect(x - flip * 2 * z - 8 * z + i * 3.6 * z, y - 5 * z + bob, 1.8 * z, 1.6 * z); }
    const wx = x + flip * 3 * z, wy = y + 1 * z + bob, a = now / 400;                     // Schaufelrad
    circle(wx, wy, 4.6 * z, C('#e8604f'));
    g.strokeStyle = C('#fffaf0'); g.lineWidth = 0.9 * z;
    for (let i = 0; i < 4; i++) { const b2 = a + i * Math.PI / 4; g.beginPath(); g.moveTo(wx - Math.cos(b2) * 4.2 * z, wy - Math.sin(b2) * 4.2 * z); g.lineTo(wx + Math.cos(b2) * 4.2 * z, wy + Math.sin(b2) * 4.2 * z); g.stroke(); }
    box(x + flip * 6 * z, y - 7 * z + bob, 2.6 * z, 1.6 * z, 9 * z, '#3a3f4a', '#e8604f', 1.4 * z);   // Schornstein
    smoke(x + flip * 6 * z, y - 18 * z + bob, z, now, true);
  } else if (m.ship === 'motor') {
    wake(34);
    ellipse(x, y + 2 * z + bob, 22 * z, 7 * z, C('#2f5e9e'));
    ellipse(x, y + bob, 21 * z, 6 * z, C('#fffaf0'));
    box(x - flip * 1 * z, y - 1 * z + bob, 26 * z, 5 * z, 6 * z, '#fffaf0', null, 0);
    box(x - flip * 3 * z, y - 7 * z + bob, 16 * z, 3.6 * z, 5 * z, '#f5ecdc', '#3e7fd0', 1.6 * z);
    for (let i = 0; i < 6; i++) { g.fillStyle = win; g.fillRect(x - flip * 1 * z - 11 * z + i * 4 * z, y - 5 * z + bob, 2.2 * z, 1.6 * z); }
    box(x + flip * 6 * z, y - 12 * z + bob, 3 * z, 2 * z, 4 * z, '#e8604f', '#4a4a58', 1.4 * z);
  } else if (m.ship === 'katamaran') {
    wake(38);
    for (const o of [-3, 3]) ellipse(x + o * 0.6 * z, y + 2 * z + o * z + bob, 19 * z, 3 * z, C('#e9f4f7'));
    poly([[x - 14 * z, y - 2 * z + bob], [x + 16 * z, y - 2 * z + bob], [x + 12 * z, y - 7 * z + bob], [x - 10 * z, y - 7 * z + bob]], C('#fffaf0'));
    poly([[x - 8 * z, y - 7 * z + bob], [x + 10 * z, y - 7 * z + bob], [x + 6 * z, y - 11 * z + bob], [x - 5 * z, y - 11 * z + bob]], C('#2aa6a1'));
    for (let i = 0; i < 5; i++) { g.fillStyle = lit ? '#ffd873' : C('#1f4f63'); g.fillRect(x - 7 * z + i * 3.4 * z, y - 6 * z + bob, 2.2 * z, 1.3 * z); }
  } else {                                                                                  // Holzfähre
    wake(22);
    ellipse(x, y + 2 * z + bob, 15 * z, 5 * z, C('#8b5a3c'));
    ellipse(x, y + 0.6 * z + bob, 14 * z, 4.2 * z, C('#c9a26f'));
    box(x - flip * 2 * z, y - 1 * z + bob, 8 * z, 3.6 * z, 6 * z, '#fff6e4', '#e8604f', 2.4 * z);
    g.fillStyle = win; g.fillRect(x - flip * 2 * z - 1 * z, y - 4.5 * z + bob, 2 * z, 1.6 * z);
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1 * z;
    g.beginPath(); g.moveTo(x + flip * 6 * z, y + bob); g.lineTo(x + flip * 6 * z, y - 14 * z + bob); g.stroke();
    poly([[x + flip * 6 * z, y - 14 * z + bob], [x + flip * 11 * z, y - 12 * z + bob], [x + flip * 6 * z, y - 10 * z + bob]], C('#e8604f'));
  }
  if (lit) kGlow(x, y - 4 * z + bob, z, 18);
}
// Fischkutter: je Hafen-Stufe einer; sie ziehen draußen vor dem Hafen ihre Kreise
function fishBoats(now) {
  const out = [];
  for (const [k, t] of state.tiles) {
    if (t.b !== 'hafen') continue;
    const o = fishingGround(k);
    if (!o) continue;
    const [x, y] = keyXY(k);
    for (let i = 0; i < Math.min(3, t.lvl || 1); i++) {
      const a = now / 9000 * (i % 2 ? -1 : 1) + i * 2.1 + hash(x, y, 7) * 6, r = 1.1 + i * 0.7;
      out.push({ boat: true, fish: true, px: o[0] + Math.cos(a) * r, py: o[1] + Math.sin(a) * r, du: -Math.sin(a), dv: Math.cos(a) });
    }
  }
  return out;
}
function drawFishMover(m, z, now) {
  const p = toScreen(m.px, m.py), x = p.x, y = p.y, bob = Math.sin(now / 500 + m.px * 3) * 0.9 * z;
  ellipse(x, y + 2 * z + bob, 8 * z, 3 * z, C('#e8604f'));
  box(x - 1 * z, y - 1 * z + bob, 3 * z, 1.6 * z, 4 * z, '#ffffff', '#3e8ed0', 2.5 * z);
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.9 * z;
  g.beginPath(); g.moveTo(x + 3 * z, y + bob); g.lineTo(x + 8 * z, y - 9 * z + bob); g.stroke();       // Angelausleger
}

// Richtung vom Hafen aufs offene Wasser (für Kutter, Frachter, Kreuzfahrtschiff)
function seaDir(cx, cy) { return DIRS.find(([dx, dy]) => terrainAt(Math.round(cx + dx * 4), Math.round(cy + dy * 4)) === 'water'); }
// Frachter: fährt nach einem Handel eine Minute lang vom Hafen hinaus
function cargoShip() {
  if (!lastTrade || Date.now() - lastTrade.t > 60e3 || !state.tiles.get(lastTrade.at)) return null;
  const r = openSeaRoute(lastTrade.at);
  if (!r) return null;
  const [px, py, du, dv] = routeAt(r, (Date.now() - lastTrade.t) / 60e3 * r.len);
  return { boat: true, cargo: true, px, py, du, dv };
}
function drawCargoMover(m, z, now) {
  const p = toScreen(m.px, m.py), x = p.x, y = p.y, bob = Math.sin(now / 900) * 0.8 * z;
  ellipse(x, y + 3 * z, 30 * z, 9 * z, 'rgba(230,248,255,0.4)');
  ellipse(x, y + 2 * z + bob, 22 * z, 7 * z, C('#8e3b32'));
  ellipse(x, y + bob, 21 * z, 6 * z, C('#b8574b'));
  const cols = ['#3e7fd0', '#f2b53a', '#58b36a', '#e8604f'];
  for (let i = 0; i < 4; i++) box(x - 12 * z + i * 6 * z, y - 1 * z + bob, 5 * z, 3 * z, 5 * z, cols[i], null, 0);
  box(x + 13 * z, y - 1 * z + bob, 5 * z, 3 * z, 10 * z, '#fffaf0', '#4a4a58', 2 * z);          // Brücke
}

// ---------------------------------------------------------------------------
// Tiere in der Natur (Block 56): tauchen dort auf, wo es passt – Schmetterlinge bei Blumen (je schöner, desto mehr),
// Vögel über Wald und Park, Fische und Frösche im Teich, Möwen und Robben an der Küste; seltene nur unter besonderen
// Bedingungen. Nur Bild und Antippen (Album „Naturbeobachtungen“), höchstens CRITTER_MAX gleichzeitig.
// ---------------------------------------------------------------------------
const critters = [], CRITTER_MAX = 20;
const FLOWERY = new Set(['blumen', 'blumentopf', 'riesenblume', 'rosenbogen', 'schmetterlingsgarten']);
function flowersNear(x, y, r) {
  let n = 0;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const k = (x + dx) + ',' + (y + dy), ds = state.decos.get(k), t = state.tiles.get(k);
    if (t && FLOWERY.has(baseOf(t.b))) n += 2;
    if (ds) for (const d of ds) if (d && FLOWERY.has(baseOf(d.b))) n++;
  }
  return n;
}
const treeAt = (x, y) => { const ter = terrainAt(x, y), ds = state.decos.get(x + ',' + y); return ter === 'forest' || ter === 'obst' || bAt(x, y) === 'vogelbaum' || !!(ds && ds.some(d => d && baseOf(d.b) === 'baum')); };
function quietAt(x, y, r) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const b = bAt(x + dx, y + dy); if (b && NOISY.has(b)) return false; }
  return true;
}
// Welche Tiere hier vorkommen können, mit Chance je Versuch
function natureAt(x, y, part) {
  const out = [], ter = terrainAt(x, y), night = part === 'nacht';
  if (ter === 'water') {
    const shore = DIRS.some(([dx, dy]) => terrainAt(x + dx, y + dy) !== 'water');
    if (isSea(x, y)) {
      if (!landWithin(x, y, 3)) return out;
      if (!night) out.push(['moewe', 0.06]);
      if (shore && !night) out.push(['robbe', 0.035]);
      out.push(['fisch', 0.04]);
      return out;
    }
    if (!ownedTile(x, y)) return out;
    const fl = flowersNear(x, y, 2);
    if (fl && shore && !night) out.push(['eisvogel', 0.02]);
    if (beautyAround(x, y, 2) >= 60) out.push(['goldfisch', 0.015]);
    out.push(['fisch', 0.1 + 0.03 * fl]);
    if (shore) out.push(['frosch', 0.06 + 0.02 * fl]);
    return out;
  }
  if (!ownedTile(x, y)) return out;
  const b = bAt(x, y);
  if (b === 'schmetterlingsgarten' && !night) out.push(['schmetterling', 0.6]);
  if (b === 'vogelbaum' && !night) out.push(['vogel', 0.6]);
  if (b === 'seerosenteich') out.push(['frosch', 0.4]);
  const fl = flowersNear(x, y, 1), park = terraLook(x, y) === 'park';
  if (fl || park) {
    const beauty = beautyAround(x, y, 1);
    if (night) out.push(['gluehwurm', 0.05]);
    else {
      if (beauty >= 60 && fl) out.push(['regenbogenfalter', 0.015]);
      out.push(['schmetterling', Math.min(0.5, 0.06 + 0.04 * fl + beauty / 500)]);
    }
  }
  if (treeAt(x, y)) {
    if (night && ter === 'forest') out.push(['eule', 0.025]);
    if (!night && ter === 'forest' && DIRS.some(([dx, dy]) => terrainAt(x + dx, y + dy) === 'grass') && quietAt(x, y, 4)) out.push(['reh', 0.025]);
    if (!night) out.push(['vogel', ter === 'forest' ? 0.08 : 0.05]);
  }
  return out;
}
const FALTER = ['#f28cb1', '#ffd23f', '#9ad0f5', '#ffffff', '#f2a03a', '#b07ad6'];
function spawnCritter(id, x, y, now) {
  const r = Math.random, life = { schmetterling: 9, regenbogenfalter: 12, vogel: 12, moewe: 14, fisch: 4.5, goldfisch: 4.5, frosch: 12, robbe: 20,
    eisvogel: 10, gluehwurm: 14, eule: 16, reh: 16 }[id];
  const c = { critter: true, id, x: x + (r() - 0.5) * 0.6, y: y + (r() - 0.5) * 0.6, t0: now, until: now + (life + r() * life * 0.4) * 1000, seed: r() * 100,
    col: FALTER[Math.floor(r() * FALTER.length)], dir: r() * Math.PI * 2 };
  if ((id === 'frosch' || id === 'eisvogel') && terrainAt(x, y) === 'water') {   // ans Ufer, nicht mitten aufs Wasser
    const land = DIRS.find(([dx, dy]) => terrainAt(x + dx, y + dy) !== 'water');
    if (land) { c.x = x + land[0] * 0.42; c.y = y + land[1] * 0.42; }
  }
  critterPos(c, now);
  critters.push(c);
  return c;
}
function natureTick(now) {
  for (let i = critters.length - 1; i >= 0; i--) if (now > critters[i].until) critters.splice(i, 1);
  const part = dayPart();
  for (let n = 0; n < 24; n++) {
    const { x, y } = slotAt(Math.random() * W, 60 + Math.random() * Math.max(1, H - 120));
    for (const [id, p] of natureAt(x, y, part)) {
      if (Math.random() >= p) continue;
      if (critters.length >= CRITTER_MAX && !NATURE_BY_ID[id].rare) continue;           // seltene dürfen immer
      if (critters.some(c => c.id === id && Math.abs(c.x - x) + Math.abs(c.y - y) < 2)) continue;
      spawnCritter(id, x, y, now);
      break;
    }
  }
}
// Wo ist das Tier gerade (Feld-Koordinaten px/py, Höhe h in Bildpunkten bei Zoom 1)?
function critterPos(c, now) {
  const t = (now - c.t0) / 1000, s = c.seed, fl = c.flee ? (now - c.flee) / 1000 : 0;
  let ox = 0, oy = 0, h = 0;
  switch (c.id) {
    case 'schmetterling': case 'regenbogenfalter':
      ox = Math.sin(t * 0.7 + s) * 0.45 + Math.sin(t * 1.9 + s) * 0.12; oy = Math.cos(t * 0.6 + s * 2) * 0.45;
      h = 9 + Math.sin(t * 2.3 + s) * 3 + fl * 40; break;
    case 'vogel': case 'eule': {
      const sit = c.id === 'eule' ? 999 : 3 + (s % 4), fly = c.flee ? fl : Math.max(0, t - sit);
      ox = Math.cos(c.dir) * fly * 1.6; oy = Math.sin(c.dir) * fly * 1.6;
      h = 20 + fly * 14; c.flying = fly > 0; break;
    }
    case 'moewe': ox = Math.cos(t * 0.5 + s) * 1.4 + (c.flee ? fl * 3 : 0); oy = Math.sin(t * 0.5 + s) * 1.4; h = 30 + Math.sin(t * 1.3) * 3 + fl * 30; break;
    case 'fisch': case 'goldfisch': { const ph = (t % 1.5) / 1.5; ox = Math.cos(c.dir) * (ph - 0.5) * 0.5; oy = Math.sin(c.dir) * (ph - 0.5) * 0.5; h = ph < 0.6 ? Math.sin(ph / 0.6 * Math.PI) * 9 : -1; break; }
    case 'frosch': { const hop = (t + s) % 3.5 < 0.4 ? Math.sin(((t + s) % 3.5) / 0.4 * Math.PI) * 4 : 0; h = hop + (c.flee ? Math.sin(Math.min(1, fl * 2) * Math.PI) * 6 : 0);
      if (c.flee) { ox = Math.cos(c.dir) * fl * 1.2; oy = Math.sin(c.dir) * fl * 1.2; } break; }
    case 'robbe': h = Math.sin(t * 1.5 + s) * 0.8 - (c.flee ? fl * 8 : 0); break;
    case 'eisvogel': { const d = (t + s) % 5; h = d > 4 ? 10 - Math.sin((d - 4) * Math.PI) * 14 : 10; if (c.flee) { h += fl * 25; ox = Math.cos(c.dir) * fl * 2; oy = Math.sin(c.dir) * fl * 2; } break; }
    case 'gluehwurm': ox = Math.sin(t * 0.3 + s) * 0.3; oy = Math.cos(t * 0.25 + s) * 0.3; h = 6 + Math.sin(t * 0.8) * 2; break;
    case 'reh': if (c.flee) { ox = Math.cos(c.dir) * fl * 2.5; oy = Math.sin(c.dir) * fl * 2.5; } break;
  }
  c.px = c.x + ox; c.py = c.y + oy; c.h = h;
}
function stepCritters(now) { for (const c of critters) critterPos(c, now); }
// Wegfliegen, abtauchen, weglaufen – und fürs Album eintragen
function tapCritter(c) {
  const now = performance.now(), n = NATURE_BY_ID[c.id], key = 'natur:' + c.id;
  if (!c.flee) { c.flee = now; c.until = now + 1800; }
  if (!state.album) state.album = new Set();
  if (state.album.has(key)) return false;                                // schon entdeckt: läuft nur weg, kein Name mehr
  state.album.add(key);
  sfx('star');
  toast(`🔍 Neu entdeckt: ${n.icon} ${n.name}! (${albumCount('natur')}/${NATURE.length} im Album)`);
  save();
  return true;
}
function critterAt(sx, sy) {
  const z = cam.z;
  let best = null, bd = 6 + 7 * z;
  for (const c of critters) {
    if (c.flee || c.h < 0) continue;
    const p = toScreen(c.px, c.py), d = Math.hypot(sx - p.x, sy - (p.y - c.h * z));
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function drawCritter(c, z, now) {
  const p = toScreen(c.px, c.py), t = (now - c.t0) / 1000, x = p.x, y = p.y - c.h * z;
  const fade = c.flee ? Math.max(0, 1 - (now - c.flee) / 1800) : Math.min(1, t * 2, (c.until - now) / 600);
  if (fade <= 0) return;
  g.globalAlpha = fade;
  const shadow = r => ellipse(p.x, p.y, r * z, r * 0.45 * z, 'rgba(40,60,20,0.15)');
  switch (c.id) {
    case 'schmetterling': case 'regenbogenfalter': {
      const f = Math.abs(Math.sin(t * 18 + c.seed)), w = (1 + f * 1.4) * z;
      const cols = c.id === 'regenbogenfalter' ? ['#e8604f', '#ffd23f', '#5f8fe8'] : [c.col];
      cols.forEach((col, i) => { const k = 1 - i * 0.28; ellipse(x - w * 0.9 * k, y - 0.4 * z, w * k, 1.8 * z * k, col); ellipse(x + w * 0.9 * k, y - 0.4 * z, w * k, 1.8 * z * k, col); });
      ellipse(x, y, 0.4 * z, 1.3 * z, '#4a3328'); break;
    }
    case 'vogel': {
      if (c.flying) {
        const f = Math.sin(t * 14 + c.seed) * 2.2 * z;
        g.strokeStyle = '#5a4636'; g.lineWidth = 1.1 * z; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x - 3.2 * z, y - f); g.quadraticCurveTo(x - 1.4 * z, y - 1.6 * z, x, y); g.quadraticCurveTo(x + 1.4 * z, y - 1.6 * z, x + 3.2 * z, y - f); g.stroke();
      } else {
        const hop = Math.abs(Math.sin(t * 3 + c.seed)) > 0.95 ? 1 * z : 0;
        ellipse(x, y - hop, 2.1 * z, 1.7 * z, '#a86b3c'); ellipse(x + 0.5 * z, y + 0.4 * z - hop, 1.2 * z, 1 * z, '#f2a03a');
        circle(x + 1.6 * z, y - 1.6 * z - hop, 1.2 * z, '#a86b3c'); circle(x + 2 * z, y - 1.8 * z - hop, 0.3 * z, '#2a2420');
        poly([[x + 2.6 * z, y - 1.7 * z - hop], [x + 3.6 * z, y - 1.4 * z - hop], [x + 2.6 * z, y - 1.2 * z - hop]], '#f2c14e');
      }
      break;
    }
    case 'moewe': {
      const f = Math.sin(t * 6 + c.seed) * 2 * z;
      g.lineCap = 'round';
      g.strokeStyle = '#7a8088'; g.lineWidth = 2 * z; g.beginPath(); g.moveTo(x - 4.6 * z, y - f); g.quadraticCurveTo(x - 2 * z, y - 2.4 * z, x, y); g.quadraticCurveTo(x + 2 * z, y - 2.4 * z, x + 4.6 * z, y - f); g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.3 * z; g.beginPath(); g.moveTo(x - 3.8 * z, y - f * 0.8); g.quadraticCurveTo(x - 2 * z, y - 2.4 * z, x, y); g.quadraticCurveTo(x + 2 * z, y - 2.4 * z, x + 3.8 * z, y - f * 0.8); g.stroke();
      break;
    }
    case 'fisch': case 'goldfisch': {
      const ph = (t % 1.5) / 1.5, col = c.id === 'goldfisch' ? '#f28a1e' : '#4f6f8f';             // dunkel genug fürs helle Wasser
      if (ph < 0.6) {
        const a = (ph / 0.6 - 0.5) * 1.6 * (Math.cos(c.dir) > 0 ? 1 : -1), dx = Math.cos(c.dir) > 0 ? 1 : -1;
        g.save(); g.translate(x, y); g.rotate(a); g.scale(dx, 1);
        ellipse(0, 0, 2.6 * z, 1.2 * z, col); poly([[-2.2 * z, 0], [-3.8 * z, -1.3 * z], [-3.8 * z, 1.3 * z]], col); ellipse(0.2 * z, 0.45 * z, 1.8 * z, 0.5 * z, 'rgba(255,255,255,0.45)'); circle(1.4 * z, -0.3 * z, 0.35 * z, '#ffffff'); circle(1.5 * z, -0.3 * z, 0.2 * z, '#2a2420');
        g.restore();
      }
      if (ph > 0.55 && ph < 0.95) { const r = (ph - 0.55) * 14; g.strokeStyle = `rgba(255,255,255,${0.9 - (ph - 0.55) * 2})`; g.lineWidth = 0.8 * z; g.beginPath(); g.ellipse(p.x + Math.cos(c.dir) * 4 * z, p.y, r * z, r * 0.45 * z, 0, 0, Math.PI * 2); g.stroke(); }
      break;
    }
    case 'frosch': {
      shadow(2.4);
      ellipse(x, y - 1.2 * z, 2.6 * z, 1.8 * z, '#5aa84f'); ellipse(x, y - 0.8 * z, 1.8 * z, 1 * z, '#9ed46a');
      for (const s of [-1, 1]) { circle(x + s * 1.2 * z, y - 2.8 * z, 0.9 * z, '#5aa84f'); circle(x + s * 1.2 * z, y - 2.9 * z, 0.5 * z, '#ffffff'); circle(x + s * 1.2 * z, y - 2.9 * z, 0.25 * z, '#2a2420'); }
      break;
    }
    case 'robbe': {
      ellipse(x, y + 0.6 * z, 4.6 * z, 1.6 * z, 'rgba(255,255,255,0.35)');
      ellipse(x, y, 4 * z, 1.8 * z, '#8a8f98'); circle(x + 3 * z, y - 2 * z, 1.9 * z, '#9aa0aa');
      circle(x + 3.6 * z, y - 2.4 * z, 0.35 * z, '#2a2420'); circle(x + 2.4 * z, y - 2.4 * z, 0.35 * z, '#2a2420'); circle(x + 3.1 * z, y - 1.4 * z, 0.4 * z, '#4a4a50');
      break;
    }
    case 'eisvogel': {
      ellipse(x, y, 1.8 * z, 1.5 * z, '#2f8fd8'); ellipse(x + 0.4 * z, y + 0.5 * z, 1.2 * z, 0.9 * z, '#f2a03a');
      circle(x + 1.4 * z, y - 1.5 * z, 1.1 * z, '#2f8fd8'); circle(x + 1.7 * z, y - 1.7 * z, 0.3 * z, '#2a2420');
      poly([[x + 2.3 * z, y - 1.8 * z], [x + 4.4 * z, y - 1.4 * z], [x + 2.3 * z, y - 1.1 * z]], '#2a2420');
      poly([[x - 1.5 * z, y + 0.2 * z], [x - 3.2 * z, y + 1.4 * z], [x - 1.2 * z, y + 1.1 * z]], '#1f6fb0');
      break;
    }
    case 'gluehwurm':
      for (let i = 0; i < 6; i++) {
        const a = t * (0.6 + i * 0.13) + i * 2.1 + c.seed, gx = x + Math.cos(a) * (2 + i % 3) * 2.2 * z, gy = y + Math.sin(a * 1.3) * 3 * z, on = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
        circle(gx, gy, 2.6 * z, `rgba(230,255,120,${0.18 * on})`); circle(gx, gy, 0.8 * z, `rgba(246,255,170,${0.5 + 0.5 * on})`);
      }
      break;
    case 'eule': {
      if (c.flee) { const f = Math.sin(t * 10) * 2.6 * z; g.strokeStyle = '#7a5a3c'; g.lineWidth = 1.6 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 4 * z, y - f); g.quadraticCurveTo(x, y - 2 * z, x + 4 * z, y - f); g.stroke(); break; }
      ellipse(x, y, 2.8 * z, 3.4 * z, '#8a6a4a'); ellipse(x, y + 0.8 * z, 1.8 * z, 2.2 * z, '#c9a27e');
      poly([[x - 2.4 * z, y - 2.4 * z], [x - 1.8 * z, y - 4.6 * z], [x - 0.8 * z, y - 2.8 * z]], '#8a6a4a'); poly([[x + 2.4 * z, y - 2.4 * z], [x + 1.8 * z, y - 4.6 * z], [x + 0.8 * z, y - 2.8 * z]], '#8a6a4a');
      const blink = (t + c.seed) % 4 < 0.15;
      for (const s of [-1, 1]) { circle(x + s * 1.1 * z, y - 1.5 * z, 1 * z, '#fff6d8'); if (!blink) circle(x + s * 1.1 * z, y - 1.5 * z, 0.5 * z, '#2a2420'); }
      poly([[x - 0.4 * z, y - 0.8 * z], [x + 0.4 * z, y - 0.8 * z], [x, y + 0.1 * z]], '#e8a03a');
      break;
    }
    case 'reh': {
      shadow(5);
      const graze = !c.flee && Math.sin(t * 0.8 + c.seed) > 0.3, dx = c.flee ? (Math.cos(c.dir) - Math.sin(c.dir) > 0 ? 1 : -1) : 1, leg = c.flee ? Math.sin(t * 16) * 1.2 * z : 0;
      g.strokeStyle = '#8a5a34'; g.lineWidth = 0.9 * z;
      g.beginPath(); for (const lx of [-2.6, -1.6, 1.6, 2.6]) { g.moveTo(x + lx * dx * z, y - 3 * z); g.lineTo(x + lx * dx * z + (lx > 0 ? leg : -leg), y); } g.stroke();
      ellipse(x, y - 4 * z, 3.6 * z, 1.8 * z, '#b5794a'); circle(x - 3.4 * dx * z, y - 4.4 * z, 0.7 * z, '#ffffff');
      const hx = x + 3.4 * dx * z, hy = graze ? y - 2.4 * z : y - 7.2 * z;
      g.strokeStyle = '#b5794a'; g.lineWidth = 1.4 * z; g.beginPath(); g.moveTo(x + 2.4 * dx * z, y - 4.6 * z); g.lineTo(hx, hy); g.stroke();
      ellipse(hx + 0.6 * dx * z, hy, 1.5 * z, 1.1 * z, '#b5794a'); circle(hx + 1.7 * dx * z, hy + 0.2 * z, 0.35 * z, '#2a2420');
      ellipse(hx - 0.5 * dx * z, hy - 1.2 * z, 0.5 * z, 1 * z, '#a86b3c'); circle(hx + 0.7 * dx * z, hy - 0.3 * z, 0.25 * z, '#2a2420');
      break;
    }
  }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Schaukasten (?welt=tiere): jede Tierart fest an ihrem Platz, mit Namensschild – zum Anschauen und Antippen.
// Weggeflogene/abgetauchte Tiere kommen nach ein paar Sekunden wieder; Bewohner stehen still in einer Reihe.
// ---------------------------------------------------------------------------
let SHOWCASE = null;
function showcaseTick(now) {
  if (!SHOWCASE) return;
  for (const s of SHOWCASE.nature || []) {
    const c = critters.find(q => q.pin === s.id);
    if (!c) { const n = spawnCritter(s.id, s.x, s.y, now); Object.assign(n, { until: Infinity, pin: s.id, label: `${NATURE_BY_ID[s.id].icon} ${NATURE_BY_ID[s.id].name}` }); }
    else if (!c.flee && now - c.t0 > 14000) c.t0 = now;                    // Vögel, Fische: von vorn
  }
  for (const s of SHOWCASE.people || []) if (!walkers.some(w => w.pin === s.home)) {
    const r = residentsOf(state.tiles.get(s.home))[0];
    if (r) walkers.unshift({ fx: s.x, fy: s.y, tx: s.x, ty: s.y, px: s.x, py: s.y, t: 0, wait: 1e9, ...residentLook(s.home, 0), shirt: SHIRTS[s.i % SHIRTS.length],
      speed: 1, goal: { kind: 'bummel' }, steps: 1e9, pin: s.home, label: `${animalOf(r).icon} ${r.name}` });
  }
}
function drawShowcaseLabels(z) {
  if (!SHOWCASE) return;
  for (const s of SHOWCASE.signs || []) {                                  // Testwelt „farben“: Name am Anfang jeder Reihe
    const p = toScreen(s.x, s.y);
    if (p.x > -200 && p.x < W + 200 && p.y > -50 && p.y < H + 50) pill(s.text, p.x, p.y - 10 * z, '#fffaf0', '#6b4f3a', Math.max(10, 5 * z));
  }
  for (const c of critters) if (c.label && !c.flee && !(state.album && state.album.has('natur:' + c.id))) {   // nur, bis es entdeckt ist
    const p = toScreen(c.px, c.py); pill(c.label, p.x, p.y - (c.h + 14) * z, '#fffaf0', '#6b4f3a', Math.max(10, 4 * z)); }
  for (const w of walkers) if (w.label) { const [hx, hy] = walkerHead(w, z); pill(w.label, hx, hy - 9 * z, '#fffaf0', '#6b4f3a', Math.max(10, 4 * z)); }
}

// ---------------------------------------------------------------------------
// Achterbahn (Block 60c): Weg durch ein Feld (Eintritt → Austritt, in Kurven ein Viertelkreis um die gemeinsame Ecke),
// Höhe von der Eintrittskante über die Mitte zur Austrittskante; Looping auf geraden Stücken. Der Zug fährt den Ring ab:
// den Lifthügel langsam hinauf, bergab umso schneller, je tiefer er kommt; an der Station hält er kurz.
// ---------------------------------------------------------------------------
const LOOP_R = 18, LOOP_T = 0.48;                                        // Looping: Höhe (px) und halbe Breite (Felder)
// Punkt f (0 … 1) auf dem Weg durch das Feld: [u, v, Höhe, Richtung u, Richtung v] in Feld-Koordinaten
function coasterGeo(x, y, info, f, loop) {
  const { din, dout } = info, h = f < 0.5 ? info.hIn + (info.h - info.hIn) * f * 2 : info.h + (info.hOut - info.h) * (f - 0.5) * 2;
  if (din[0] === dout[0] && din[1] === dout[1]) {                      // gerade
    let u = x + din[0] * (f - 0.5), v = y + din[1] * (f - 0.5), up = h;
    let inv = false, lc = null;
    if (loop && f > 0.2 && f < 0.8) { const th = (f - 0.2) / 0.6 * Math.PI * 2; u += din[0] * Math.sin(th) * LOOP_T; v += din[1] * Math.sin(th) * LOOP_T; up += LOOP_R * (1 - Math.cos(th)); inv = Math.cos(th) < -0.2; lc = [x, y, h + LOOP_R]; }
    return [u, v, up, din[0], din[1], inv, lc];
  }
  const ein = [-din[0] * 0.5, -din[1] * 0.5], eout = [dout[0] * 0.5, dout[1] * 0.5], c = [ein[0] + eout[0], ein[1] + eout[1]];
  const a0 = Math.atan2(ein[1] - c[1], ein[0] - c[0]), a1 = sweep(a0, Math.atan2(eout[1] - c[1], eout[0] - c[0])), a = a0 + (a1 - a0) * f;
  const s = Math.sign(a1 - a0);
  return [x + c[0] + Math.cos(a) * 0.5, y + c[1] + Math.sin(a) * 0.5, h, -Math.sin(a) * s, Math.cos(a) * s];
}
// Schiene, Stützen, Looping und Station auf einem Feld (cx, cy: Bildschirm-Mitte des Felds)
function drawCoasterTile(cx, cy, z, x, y, t) {
  const info = COASTER_AT.get(x + ',' + y) || (t && t.loop ? { c: -1, h: 3, hIn: 3, hOut: 3, din: [1, 0], dout: [1, 0] } : null), S = (u, v, up) => [cx + ((u - x) - (v - y)) * TW / 2 * z, cy + ((u - x) + (v - y)) * TH / 2 * z - up * z];
  const lines = [];                                                    // je Teilstück: Punkte [u, v, h, du, dv]
  if (info && info.din) { const L = []; for (let i = 0; i <= 12; i++) L.push(coasterGeo(x, y, info, i / 12, false)); lines.push(L); }
  else {                                                              // noch kein Rundkurs, kein gerades Stück: zu jedem Nachbarn
    const arms = t && t.b && COASTER_AT.size ? coasterArms(x, y) : [], h = info ? info.h : 3;
    for (const [dx, dy] of arms.length ? arms : [[1, 0], [-1, 0]]) { const L = []; for (let i = 0; i <= 4; i++) L.push([x + dx * i / 8, y + dy * i / 8, h, dx, dy]); lines.push(L); }
  }
  // Station (Block 60e): Bahnsteig auf einer Seite der Schiene (Drehen wählt die Seite), Dach über Bahnsteig und Gleis
  const stD = info && info.din ? info.din : (t && (t.rot & 1) ? [0, 1] : [1, 0]), stN = [-stD[1], stD[0]], stS = t && (t.rot & 2) ? -1 : 1;
  const stP = (al, ac, up) => S(x + stD[0] * al + stN[0] * ac * stS, y + stD[1] * al + stN[1] * ac * stS, up);
  if (t && t.b === 'fz_station') {
    poly([stP(-0.48, 0.2, 1.5), stP(0.48, 0.2, 1.5), stP(0.48, 0.5, 1.5), stP(-0.48, 0.5, 1.5)], C('#e6d3b8'));
    poly([stP(-0.48, 0.2, 0), stP(0.48, 0.2, 0), stP(0.48, 0.2, 1.5), stP(-0.48, 0.2, 1.5)], C('#cbb89b'));
    for (const [al, ac] of [[-0.42, 0.46], [0.42, 0.46], [-0.42, -0.24], [0.42, -0.24]]) { const p0 = stP(al, ac, ac > 0 ? 1.5 : 0), p1 = stP(al, ac, 17); g.strokeStyle = C('#fffaf0'); g.lineWidth = 1 * z; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
  }
  for (const L of lines) {
    const mid = L[Math.floor(L.length / 2)];
    if (mid[2] > 5) {                                                 // Stütze(n) bis zum Boden
      const b0 = S(mid[0], mid[1], 0), b1 = S(mid[0], mid[1], mid[2]);
      g.strokeStyle = C('#f4f1ea'); g.lineWidth = 1.6 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...b0); g.lineTo(...b1); g.stroke();
      if (mid[2] > 22) { g.lineWidth = 0.6 * z; g.beginPath(); for (let h = 0; h < mid[2] - 6; h += 8) { const p = S(mid[0], mid[1], h), q = S(mid[0], mid[1], h + 8); g.moveTo(p[0] - 2 * z, p[1]); g.lineTo(q[0] + 2 * z, q[1]); } g.stroke(); }
    }
    const side = (P, o) => { const [u, v, h, du, dv] = P; return S(u - dv * o, v + du * o, h); };
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.9 * z; g.beginPath();    // Schwellen
    L.forEach((P, i) => { if (i % 2) return; const a = side(P, 0.13), b = side(P, -0.13); g.moveTo(...a); g.lineTo(...b); }); g.stroke();
    for (const o of [0.1, -0.1]) { g.strokeStyle = C('#e8604f'); g.lineWidth = 1.4 * z; g.beginPath(); L.forEach((P, i) => { const p = side(P, o); i ? g.lineTo(...p) : g.moveTo(...p); }); g.stroke(); }
  }
  if (t && t.loop && info && info.din) {                              // Looping: senkrechter Ring (auch auf offener Strecke)
    for (const o of [0.1, -0.1]) {
      g.strokeStyle = C('#e8604f'); g.lineWidth = 1.4 * z; g.beginPath();
      for (let i = 0; i <= 32; i++) { const P = coasterGeo(x, y, info, 0.2 + i / 32 * 0.6, true), [u, v, h, du, dv] = P, p = S(u - info.din[1] * o, v + info.din[0] * o, h); i ? g.lineTo(...p) : g.moveTo(...p); }
      g.stroke();
    }
    const top = S(x, y, info.h + LOOP_R * 2), b0 = S(x, y, 0); g.strokeStyle = C('#f4f1ea'); g.lineWidth = 1.2 * z; g.beginPath(); g.moveTo(...b0); g.lineTo(...top); g.stroke();
  }
  if (t && t.b === 'fz_station') {                                    // Dach über Bahnsteig und Gleis
    const rf = [[-0.5, -0.3], [0.5, -0.3], [0.5, 0.52], [-0.5, 0.52]].map(([al, ac]) => stP(al, ac, 17)), top = [stP(-0.5, 0.11, 22), stP(0.5, 0.11, 22)];
    poly([rf[0], rf[1], top[1], top[0]], C('#f07a6a')); poly([rf[3], rf[2], top[1], top[0]], C('#e8604f'));
    poly([rf[1], rf[2], top[1]], C('#c94d3f')); poly([rf[0], rf[3], top[0]], C('#c94d3f'));
  }
}
const coasterRuns = new Map();                                          // Station → { s (Felder entlang des Rings), wait }
function stepCoasters(dt) {
  for (const c of COASTERS) {
    const r = coasterRuns.get(c.key) || { s: 0, wait: 2 };
    coasterRuns.set(c.key, r);
    if (r.wait > 0) { r.wait = Math.max(0, r.wait - dt); continue; }
    const i = Math.floor(r.s) % c.n, h = c.h[i], up = c.h[(i + 1) % c.n] > h + 0.5, v = up ? 0.9 : 1 + 0.12 * Math.sqrt(Math.max(0, c.Hmax - h));   // bergauf gezogen, bergab schneller
    r.s += v * dt;
    if (r.s >= c.n) { r.s -= c.n; r.wait = 2.5; }                      // eine Runde: an der Station halten
  }
  for (const k of [...coasterRuns.keys()]) if (!COASTERS.some(c => c.key === k)) coasterRuns.delete(k);
}
function coasterPoint(c, s) {
  s = ((s % c.n) + c.n) % c.n;
  const i = Math.floor(s), k = c.ring[i], [x, y] = keyXY(k), t = state.tiles.get(k);
  return coasterGeo(x, y, COASTER_AT.get(k), s - i, t && t.loop);
}
function coasterCars() {
  const out = [];
  COASTERS.forEach((c, ci) => {
    const r = coasterRuns.get(c.key) || { s: 0 };
    for (let j = 0; j < 3; j++) { const s = r.s - j * 0.42, [u, v, h, du, dv, inv, lc] = coasterPoint(c, s); out.push({ coaster: true, ci, s, px: u, py: v, h, du, dv, j, inv, lc }); }
  });
  return out;
}
// Wagen in Seitenansicht entlang der Schiene: Richtung aus zwei Punkten auf dem Bildschirm, die Gäste sitzen auf der
// „oberen“ Seite – im Looping zur Mitte des Rings hin (oben also kopfüber)
function drawCoasterCar(m, z) {
  const c = COASTERS[m.ci];
  if (!c) return;
  const scr = (u, v, h) => { const p = toScreen(u, v); return [p.x, p.y - h * z]; };
  const [u1, v1, h1] = coasterPoint(c, m.s + 0.05), p0 = scr(m.px, m.py, m.h), p1 = scr(u1, v1, h1);
  let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
  let nx = ty, ny = -tx;                                                  // Senkrechte zur Fahrtrichtung
  if (m.lc) { const q = scr(...m.lc); if (nx * (q[0] - p0[0]) + ny * (q[1] - p0[1]) < 0) { nx = -nx; ny = -ny; } }   // zur Ring-Mitte
  else if (ny > 0) { nx = -nx; ny = -ny; }                                // sonst nach oben
  const L = 5.5 * z, H = 3.6 * z, col = m.j === 0 ? '#ffd23f' : '#e8604f';
  const P = (a, b) => [p0[0] + tx * a + nx * b, p0[1] + ty * a + ny * b];
  poly([P(-L, 0.6 * z), P(L, 0.6 * z), P(L * 0.92, H), P(-L, H)], C(col));                 // Wagenkasten
  poly([P(-L, 0.6 * z), P(L, 0.6 * z), P(L, 1.6 * z), P(-L, 1.6 * z)], C(shade(col, -0.25)));
  for (const a of [-L * 0.45, L * 0.35]) { const [hx, hy] = P(a, H + 1.6 * z); circle(hx, hy, 1.4 * z, C(['#f4c28f', '#b9b9c6', '#fffaf2'][(m.j + (a > 0 ? 1 : 0)) % 3])); }
  for (const a of [-L * 0.6, L * 0.6]) { const [wx, wy] = P(a, 0.4 * z); circle(wx, wy, 0.9 * z, C('#4a4a58')); }   // Räder
}

// Parade (Block 60d): solange sie läuft, ziehen Figuren mit Fähnchen über den Freizeitpark (wie Spaziergänger, nur auf dem Boden)
const paraders = [];
const fzWalk = (x, y) => terraLook(x, y) === 'fz' && walkable(x, y);
const PARADE_FLAGS = ['#e8604f', '#ffd23f', '#5f8fe8', '#58b36a', '#f28cb1', '#b07ad6'];
function syncParade() {
  const want = fzFestLeft() > 0 ? Math.min(10, FZPARKS.reduce((n, p) => n + 2 + p.stage * 2, 0)) : 0;
  while (paraders.length > want) paraders.pop();
  if (paraders.length >= want || !FZPARKS.length) return;
  const p = FZPARKS[Math.floor(Math.random() * FZPARKS.length)], free = p.tiles.map(keyXY).filter(([x, y]) => fzWalk(x, y));
  if (!free.length) return;
  const [sx, sy] = free[Math.floor(Math.random() * free.length)], a = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  paraders.push({ fx: sx, fy: sy, tx: sx, ty: sy, px: sx, py: sy, t: 1, wait: 0.5, kind: ANIMALS.indexOf(a), fur: a.fur || FUR[Math.floor(Math.random() * FUR.length)],
    shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], speed: 0.6, flag: PARADE_FLAGS[Math.floor(Math.random() * PARADE_FLAGS.length)] });
}
