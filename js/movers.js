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
  return !t || t.b === 'weg';
};
const drivable = () => false;

function syncMovers() {
  const wantW = Math.min(24, Math.floor(T.pop / 4));
  while (walkers.length > wantW) walkers.pop();
  if (walkers.length < wantW) {
    const houses = [...state.tiles].filter(([, t]) => t.b === 'haus');
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
  cars.length = 0;             // keine Straßen mehr – Fahrzeuge kommen später mit der Bahn zurück
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
  for (const w of walkers) stepMover(w, dt, walkable, true);
  for (const c of cars) stepMover(c, dt, drivable, false);
  for (const list of [walkers, cars]) for (let i = list.length - 1; i >= 0; i--) if (list[i].gone) list.splice(i, 1);
}
function drawWalker(w, z, now) {
  const p = toScreen(w.px, w.py);
  const bob = w.wait > 0 ? 0 : Math.abs(Math.sin(now / 150 + w.speed * 10)) * 1.6 * z;
  const x = p.x + 6 * z, y = p.y - bob - 2 * z;
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
