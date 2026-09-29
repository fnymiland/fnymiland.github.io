'use strict';
// ---------------------------------------------------------------------------
// Bewohner und Fahrzeuge
// ---------------------------------------------------------------------------
const FUR = ['#f4c28f', '#c9a27e', '#fffaf2', '#b9b9c6', '#f7d9a8', '#e7a06c', '#9c7b64'];
const SHIRTS = ['#e8705f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1'];
const CARS = ['#e8705f', '#5f8fe8', '#58b36a', '#ffffff', '#b07ad6', '#f2b53a'];
const walkers = [], cars = [];
const walkable = (x, y) => {
  if (!ownedTile(x, y) || terrainAt(x, y) === 'water') return false;
  const t = objAt(x, y);
  return !t || t.b === 'weg' || (isCrossing(t) && (t.foot || !crossingClosed(x, y)));   // an der Schranke warten, über die Brücke nie
};
// Schranke zu, sobald ein Zugwagen in der Nähe ist
function crossingClosed(x, y) {
  if (!trains.length) return false;
  return trainCars().some(c => Math.abs(c.px - x) + Math.abs(c.py - y) < 2.3);
}
const drivable = () => false;

function syncMovers() {
  const wantW = Math.min(24, Math.floor(T.pop / 4));
  while (walkers.length > wantW) walkers.pop();
  if (walkers.length < wantW) {
    const houses = [...state.tiles].filter(([, t]) => isHome(t.b));        // Bewohner kommen aus jedem Wohnhaus
    if (houses.length) {
      const [x, y] = keyXY(houses[Math.floor(Math.random() * houses.length)][0]);
      const free = DIRS.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => walkable(a, b));
      if (free.length) {
        const [sx, sy] = free[Math.floor(Math.random() * free.length)];
        const ht = state.tiles.get(houses[Math.floor(Math.random() * houses.length)][0]);
        walkers.push({ fx: sx, fy: sy, tx: sx, ty: sy, px: sx, py: sy, t: 1, wait: 0.5,
          kind: Math.max(0, ANIMALS.findIndex(a => a.id === (ht && ht.animal))), fur: FUR[Math.floor(Math.random() * FUR.length)],
          shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], speed: 0.7 + Math.random() * 0.4 });
      }
    }
  }
  cars.length = 0;             // keine Straßen mehr – dafür fahren Züge (syncTrains)
  syncTrains();
}
function stepMover(w, dt, ok, preferWay) {
  if (!ok(w.tx, w.ty)) { w.tx = w.fx; w.ty = w.fy; w.t = 1; }
  if (!ok(w.fx, w.fy)) { w.gone = true; return; }
  if (w.wait > 0) { w.wait -= dt; return; }
  w.t += dt * w.speed;
  if (w.t >= 1) {
    const px = w.fx, py = w.fy;
    w.fx = w.tx; w.fy = w.ty; w.t = 0;
    const cands = DIRS.map(([dx, dy]) => [w.fx + dx, w.fy + dy]).filter(([a, b]) => ok(a, b));
    let pool = cands;
    if (preferWay) {
      const ways = cands.filter(([a, b]) => bAt(a, b) === 'weg');
      if (ways.length && Math.random() < (bAt(w.fx, w.fy) === 'weg' ? 0.95 : 0.6)) pool = ways;
    }
    if (pool.length > 1) pool = pool.filter(([a, b]) => a !== px || b !== py);
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
  for (const w of walkers) stepMover(w, dt, walkable, true);
  for (const c of cars) stepMover(c, dt, drivable, false);
  for (const list of [walkers, cars]) for (let i = list.length - 1; i >= 0; i--) if (list[i].gone) list.splice(i, 1);
}
function drawWalker(w, z, now) {
  const p = toScreen(w.px, w.py);
  const bob = w.wait > 0 ? 0 : Math.abs(Math.sin(now / 150 + w.speed * 10)) * 1.6 * z;
  // auf einer Bogenbrücke geht es hoch und wieder runter
  const arch = archAt(w.px, w.py), lift = arch ? archH(arch.b) * z : 0;
  const x = p.x + 6 * z, y = p.y - bob - 2 * z - lift;
  ellipse(x, p.y - 1 * z, 4.5 * z, 2 * z, 'rgba(40,60,20,0.2)');
  ellipse(x, y - 4 * z, 3.6 * z, 4 * z, w.shirt);
  const hy = y - 11 * z;
  if (w.kind === 0) {
    poly([[x - 4.5 * z, hy - 2 * z], [x - 3.5 * z, hy - 7.5 * z], [x - 0.8 * z, hy - 4 * z]], w.fur);
    poly([[x + 4.5 * z, hy - 2 * z], [x + 3.5 * z, hy - 7.5 * z], [x + 0.8 * z, hy - 4 * z]], w.fur);
  } else if (w.kind === 1) {
    circle(x - 3.8 * z, hy - 3.8 * z, 2 * z, w.fur); circle(x + 3.8 * z, hy - 3.8 * z, 2 * z, w.fur);
  } else {
    ellipse(x - 2 * z, hy - 7 * z, 1.4 * z, 4 * z, w.fur); ellipse(x + 2 * z, hy - 7 * z, 1.4 * z, 4 * z, w.fur);
  }
  circle(x, hy, 4.8 * z, w.fur);
  circle(x - 1.7 * z, hy - 0.3 * z, 0.7 * z, '#3d2c22'); circle(x + 1.7 * z, hy - 0.3 * z, 0.7 * z, '#3d2c22');
  ellipse(x - 2.9 * z, hy + 1.4 * z, 1 * z, 0.6 * z, 'rgba(255,120,120,0.45)');
  ellipse(x + 2.9 * z, hy + 1.4 * z, 1 * z, 0.6 * z, 'rgba(255,120,120,0.45)');
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
};
// Schienenfeld direkt am Bahnhof (dort hält der Zug)
function railStop(k) {
  const t = state.tiles.get(k), [x, y] = keyXY(k);
  for (const [fx, fy] of footprint(t.b, x, y, t.rot)) for (const [dx, dy] of DIRS) {
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
  const extend = (list, atEnd) => {
    for (let n = 0; n < 2 && list.length > 1; n++) {
      const [a, b] = atEnd ? [list[list.length - 2], list[list.length - 1]] : [list[1], list[0]];
      const [ax, ay] = keyXY(a), [bx, by] = keyXY(b), nx = 2 * bx - ax, ny = 2 * by - ay, nk = nx + ',' + ny;
      if (bAt(nx, ny) !== 'schiene' || list.includes(nk)) break;
      if (atEnd) list.push(nk); else list.unshift(nk);
    }
  };
  extend(keys, false); extend(keys, true);
  const route = railPolyline(keys);
  const distOf = k => { const [x, y] = keyXY(k); let best = 0, bd = 1e9; route.pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = route.cum[i]; } }); return [best, bd]; };
  // Halt: Mitte aller Schienenfelder direkt am Bahnhof, die auf der Strecke liegen
  route.stops = order.map(stop => {
    const st = line.stations.find(s => railStop(s) === stop), t = state.tiles.get(st), [sx, sy] = keyXY(st), ds = [];
    for (const [fx, fy] of footprint(t.b, sx, sy, t.rot)) for (const [dx, dy] of DIRS) {
      const [d, off] = distOf((fx + dx) + ',' + (fy + dy));
      if (off < 0.01) ds.push(d);
    }
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : distOf(stop)[0];
  });
  return route;
}
// Halt eines Bahnhofs auf einer Route: Mitte aller Felder direkt am Bahnhof, die auf der Strecke liegen
function stopOn(route, st) {
  const t = state.tiles.get(st), [sx, sy] = keyXY(st), ds = [];
  let best = null, bd = 0.8;                                  // sonst: nächster Punkt (Bahnhof nur an einer Kurve)
  for (const [fx, fy] of footprint(t.b, sx, sy, t.rot)) for (const [dx, dy] of DIRS) {
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
  for (const st of line.stations) {
    const t = state.tiles.get(st), [sx, sy] = keyXY(st);
    for (const [fx, fy] of footprint(t.b, sx, sy, t.rot)) for (const [dx, dy] of [[0, 0], ...DIRS]) near.add((fx + dx) + ',' + (fy + dy));
  }
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
      if (tr.powered && tr.idx === 0) tr.ls.tau += dt;          // die Zeit des Rings läuft einmal pro Linie
      continue;
    }
    if (!tr.powered) continue;
    if (tr.wait > 0) { tr.wait -= dt; continue; }
    const target = tr.stops[tr.next], step = TRAIN_SPEED * dt;
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
  const body = tr.model === 'modern' ? '#f5f5f2' : tr.model === 'tram' ? shade(col, 0.35) : col;
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
    const glass = lit ? '#ffd873' : C(tr.model === 'modern' ? '#3d4a5c' : '#bfe3ff');
    if (f.end) faceQuad(f.p, f.q, 0.18, 0.82, H * 0.48 * z, H * 0.82 * z, glass);
    else {
      const w = tr.model === 'tram' ? 3 : tr.model === 'modern' ? 1 : 4;
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
  const [sx, sy] = keyXY(e.from), p = Math.min(1, (Date.now() - e.t0) / Math.max(1, e.until - e.t0));
  const vx = i.cx - sx, vy = i.cy - sy, d = Math.hypot(vx, vy) || 1, stop = Math.max(0, d - ISLE_R - 2);
  const tx = sx + vx / d * stop, ty = sy + vy / d * stop;                                  // vor der Küste der Insel
  let px, py, du, dv;
  if (p < 0.45) { const k = p / 0.45; px = sx + (tx - sx) * k; py = sy + (ty - sy) * k; du = vx / d; dv = vy / d; }
  else if (p < 0.55) { const a = (p - 0.45) / 0.1 * Math.PI * 2; px = tx + Math.cos(a) * 2 - 2; py = ty + Math.sin(a) * 2; du = -Math.sin(a); dv = Math.cos(a); }
  else { const k = (p - 0.55) / 0.45; px = tx + (sx - tx) * k; py = ty + (sy - ty) * k; du = -vx / d; dv = -vy / d; }
  return { boat: true, px, py, du, dv };
}
function drawBoatMover(m, z, now) {
  const p = toScreen(m.px, m.py), x = p.x, y = p.y, bob = Math.sin(now / 600) * 1.2 * z;
  const flip = (m.du - m.dv) < 0 ? -1 : 1;                                                 // Bug zeigt in Fahrtrichtung
  ellipse(x, y + 3 * z, 20 * z, 6 * z, 'rgba(230,248,255,0.45)');                         // Kielwasser
  ellipse(x, y + 2 * z + bob, 13 * z, 4.5 * z, C('#8b5a3c'));
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1.3 * z;
  g.beginPath(); g.moveTo(x, y + bob); g.lineTo(x, y - 26 * z + bob); g.stroke();
  poly([[x + flip * 1 * z, y - 24 * z + bob], [x + flip * 12 * z, y - 5 * z + bob], [x + flip * 1 * z, y - 3 * z + bob]], C('#fffaf0'));
  poly([[x, y - 27 * z + bob], [x - flip * 5 * z, y - 25 * z + bob], [x, y - 23 * z + bob]], C('#e8604f'));  // Wimpel
}

// Fähren: pendeln zwischen ihren Häfen (vom Wasser vor dem einen zum Wasser vor dem anderen), warten kurz am Anleger
const FERRY_SPEED = 1.6, FERRY_WAIT = 3;
function ferryBoats(now) {
  const out = [];
  for (const f of T.ferries || []) {
    const [a, b] = f.stations.map(k => { const [x, y] = keyXY(k); return [x + 0.5, y + 0.5]; });
    const vx = b[0] - a[0], vy = b[1] - a[1], d = Math.hypot(vx, vy) || 1, ux = vx / d, uy = vy / d;
    const s0 = [a[0] + ux * 1.6, a[1] + uy * 1.6], len = Math.max(0.1, d - 3.2), lap = 2 * (len / FERRY_SPEED + FERRY_WAIT);
    let t = ((now / 1000) + hash(a[0], a[1], 9) * lap) % lap, k, dir = 1;
    const leg = len / FERRY_SPEED + FERRY_WAIT;
    if (t > leg) { t -= leg; dir = -1; }
    k = Math.max(0, Math.min(1, (t - FERRY_WAIT) / (len / FERRY_SPEED)));
    if (dir < 0) k = 1 - k;
    out.push({ boat: true, ferry: true, px: s0[0] + ux * len * k, py: s0[1] + uy * len * k, du: ux * dir, dv: uy * dir });
  }
  return out;
}
function drawFerryMover(m, z, now) {
  const p = toScreen(m.px, m.py), x = p.x, y = p.y, bob = Math.sin(now / 800 + m.px) * 1 * z;
  ellipse(x, y + 3 * z, 26 * z, 8 * z, 'rgba(230,248,255,0.45)');
  ellipse(x, y + 2 * z + bob, 18 * z, 6 * z, C('#2f5e9e'));
  ellipse(x, y + bob, 17 * z, 5.2 * z, C('#fffaf0'));
  box(x - 3 * z, y - 1 * z + bob, 9 * z, 4 * z, 7 * z, '#fffaf0', '#e8604f', 3 * z);                       // Kajüte, rotes Dach
  g.strokeStyle = C('#4a4a58'); g.lineWidth = 1.2 * z;
  g.beginPath(); g.moveTo(x + 4 * z, y - 8 * z + bob); g.lineTo(x + 4 * z, y - 15 * z + bob); g.stroke();   // Schornstein-Mast
  circle(x + 4 * z, y - 16 * z + bob, 1.4 * z, C('#ffd36e'));
}

// Fischkutter: je Hafen-Stufe einer; sie ziehen draußen vor dem Hafen ihre Kreise
function fishBoats(now) {
  const out = [];
  for (const [k, t] of state.tiles) {
    if (t.b !== 'hafen') continue;
    const [x, y] = keyXY(k), cx = x + 0.5, cy = y + 0.5;
    const dir = DIRS.find(([dx, dy]) => terrainAt(Math.round(cx + dx * 4), Math.round(cy + dy * 4)) === 'water');
    if (!dir) continue;
    const ox = cx + dir[0] * 5, oy = cy + dir[1] * 5;
    for (let i = 0; i < Math.min(3, t.lvl || 1); i++) {
      const a = now / 9000 * (i % 2 ? -1 : 1) + i * 2.1 + hash(x, y, 7) * 6, r = 1.6 + i * 0.9;
      out.push({ boat: true, fish: true, px: ox + Math.cos(a) * r, py: oy + Math.sin(a) * r, du: -Math.sin(a), dv: Math.cos(a) });
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
  const [x, y] = keyXY(lastTrade.at), cx = x + 0.5, cy = y + 0.5, dir = seaDir(cx, cy);
  if (!dir) return null;
  const k = (Date.now() - lastTrade.t) / 60e3, d = 2.5 + k * 18;
  return { boat: true, cargo: true, px: cx + dir[0] * d, py: cy + dir[1] * d, du: dir[0], dv: dir[1] };
}
// Kreuzfahrtschiff: kommt herein, liegt vor dem Großen Hafen und fährt wieder hinaus
function cruiseShips() {
  const out = [], now = Date.now();
  for (const [k, t] of state.tiles) {
    if (t.b !== 'hafen' || !t.docked || now - t.docked > CRUISE_STAY) continue;
    const [x, y] = keyXY(k), cx = x + 0.5, cy = y + 0.5, dir = seaDir(cx, cy);
    if (!dir) continue;
    const e = (now - t.docked) / 1000, far = Math.max(0, 8 - e) + Math.max(0, e - (CRUISE_STAY / 1000 - 8));   // ein- und auslaufen
    const d = 3.2 + far * 1.2;
    out.push({ boat: true, cruise: true, px: cx + dir[0] * d, py: cy + dir[1] * d, du: dir[1], dv: -dir[0] });
  }
  return out;
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
function drawCruiseMover(m, z, now) {
  const p = toScreen(m.px, m.py), x = p.x, y = p.y, bob = Math.sin(now / 1100) * 0.7 * z;
  ellipse(x, y + 4 * z, 42 * z, 12 * z, 'rgba(230,248,255,0.45)');
  ellipse(x, y + 3 * z + bob, 34 * z, 9 * z, C('#2f5e9e'));
  ellipse(x, y + 1 * z + bob, 33 * z, 8 * z, C('#fffaf0'));
  box(x - 2 * z, y - 1 * z + bob, 44 * z, 7 * z, 8 * z, '#fffaf0', null, 0);                     // Decks
  box(x - 2 * z, y - 9 * z + bob, 34 * z, 5 * z, 6 * z, '#f5ecdc', null, 0);
  const lit = night > 0.15 && isLive();
  for (let i = 0; i < 9; i++) {                                                                 // Fensterreihe
    const wx = x - 22 * z + i * 5 * z;
    g.fillStyle = lit ? '#ffd873' : C('#3e7fd0'); g.fillRect(wx, y - 5 * z + bob, 2.6 * z, 1.8 * z);
  }
  box(x + 8 * z, y - 15 * z + bob, 4 * z, 3 * z, 8 * z, '#e8604f', '#4a4a58', 2 * z);           // Schornstein
  if (lit) kGlow(x, y - 5 * z + bob, z, 26);
}
